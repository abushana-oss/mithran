import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreateRfqDto } from './dto/create-rfq.dto';
import { RfqRecord, RfqSummary, RfqStatus } from './dto/rfq-response.dto';
import { RfqEmailService } from './services/rfq-email.service';
import { RfqTrackingService } from './services/rfq-tracking.service';

@Injectable()
export class RfqService {
  private readonly logger = new Logger(RfqService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly rfqEmailService: RfqEmailService,
    private readonly rfqTrackingService: RfqTrackingService
  ) { }

  async create(userId: string, createRfqDto: CreateRfqDto): Promise<RfqRecord> {
    const {
      rfqName,
      projectId,
      bomItemIds,
      vendorIds,
      quoteDeadline,
      selectionType,
      buyerName,
      emailBody,
      emailSubject
    } = createRfqDto;

    // Generate RFQ number
    const rfqNumber = await this.generateRfqNumber();

    // Validate BOM items and vendors exist
    await this.validateBomItems(bomItemIds);
    await this.validateVendors(vendorIds);


    const { data, error } = await this.supabaseService.client
      .from('rfq_records')
      .insert({
        user_id: userId,
        project_id: projectId,
        rfq_name: rfqName,
        rfq_number: rfqNumber,
        bom_item_ids: bomItemIds,
        vendor_ids: vendorIds,
        quote_deadline: quoteDeadline,
        selection_type: selectionType,
        buyer_name: buyerName,
        email_body: emailBody,
        email_subject: emailSubject,
        status: RfqStatus.DRAFT
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create RFQ: ${error.message}`);
    }

    return this.mapToRfqRecord(data);
  }

  async findByUser(userId: string, projectId?: string): Promise<RfqSummary[]> {
    let query = this.supabaseService.client
      .from('rfq_records')
      .select(`
        id,
        rfq_name,
        rfq_number,
        status,
        bom_item_ids,
        vendor_ids,
        created_at,
        sent_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) {
      throw new BadRequestException(`Failed to fetch RFQs: ${error.message}`);
    }

    return (data || []).map((row: any) => this.mapToRfqSummary(row));
  }

  async findOne(id: string, userId: string): Promise<RfqRecord> {
    const { data, error } = await this.supabaseService.client
      .from('rfq_records')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('RFQ not found');
    }

    return this.mapToRfqRecord(data);
  }

  async sendRfq(id: string, userId: string, accessToken?: string): Promise<void> {
    this.logger.log(`Sending RFQ ${id} for user ${userId}, accessToken provided: ${!!accessToken}`);
    
    // First validate the RFQ exists and belongs to the user
    const rfq = await this.findOne(id, userId);
    this.logger.log(`RFQ details: ${JSON.stringify({ id: rfq.id, projectId: rfq.projectId, status: rfq.status })}`);

    if (rfq.status !== RfqStatus.DRAFT) {
      throw new BadRequestException('RFQ has already been sent');
    }

    // Use the database function to mark as sent
    const { error } = await this.supabaseService.client
      .rpc('send_rfq', { p_rfq_id: id, p_user_id: userId });

    if (error) {
      throw new BadRequestException(`Failed to send RFQ: ${error.message}`);
    }

    this.logger.log(`RFQ ${id} marked as sent in database`);

    // Send RFQ emails to all vendors
    await this.rfqEmailService.sendRfqEmails(rfq);

    // Create tracking record if access token provided
    if (accessToken) {
      try {
        this.logger.log(`Creating tracking record for RFQ ${rfq.id} in project ${rfq.projectId}`);
        await this.createRfqTrackingRecord(rfq, userId, accessToken);
        this.logger.log(`RFQ tracking record created successfully for RFQ ${rfq.id} in project ${rfq.projectId}`);
      } catch (error) {
        this.logger.error(`Failed to create RFQ tracking record for RFQ ${rfq.id}: ${error.message}`, error.stack);
        // Don't throw here to prevent blocking the RFQ send process
      }
    } else {
      this.logger.warn(`No access token provided for RFQ ${rfq.id} - tracking record will not be created`);
    }
  }

  async closeRfq(id: string, userId: string): Promise<void> {
    // Validate ownership first
    await this.findOne(id, userId);

    const { error } = await this.supabaseService.client
      .rpc('close_rfq', { p_rfq_id: id, p_user_id: userId });

    if (error) {
      throw new BadRequestException(`Failed to close RFQ: ${error.message}`);
    }
  }

  private async generateRfqNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    const prefix = `RFQ-${year}${month}`;
    const { count, error } = await this.supabaseService.client
      .from('rfq_records')
      .select('*', { count: 'exact', head: true })
      .like('rfq_number', `${prefix}%`);

    if (error) {
      throw new BadRequestException(`Failed to generate RFQ number: ${error.message}`);
    }

    const nextNumber = (count || 0) + 1;
    return `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
  }

  private async validateBomItems(bomItemIds: string[]): Promise<void> {
    const { count, error } = await this.supabaseService.client
      .from('bom_items')
      .select('*', { count: 'exact', head: true })
      .in('id', bomItemIds);

    if (error) {
      throw new BadRequestException(`Failed to validate BOM items: ${error.message}`);
    }

    if ((count || 0) !== bomItemIds.length) {
      throw new BadRequestException('Some BOM items do not exist');
    }
  }

  private async validateVendors(vendorIds: string[]): Promise<void> {
    const { count, error } = await this.supabaseService.client
      .from('vendors')
      .select('*', { count: 'exact', head: true })
      .in('id', vendorIds);

    if (error) {
      throw new BadRequestException(`Failed to validate vendors: ${error.message}`);
    }

    if ((count || 0) !== vendorIds.length) {
      throw new BadRequestException('Some vendors do not exist');
    }
  }

  private mapToRfqRecord(row: any): RfqRecord {
    return {
      id: row.id,
      userId: row.user_id,
      projectId: row.project_id,
      rfqName: row.rfq_name,
      rfqNumber: row.rfq_number,
      bomItemIds: row.bom_item_ids,
      vendorIds: row.vendor_ids,
      quoteDeadline: row.quote_deadline,
      selectionType: row.selection_type,
      buyerName: row.buyer_name,
      emailBody: row.email_body,
      emailSubject: row.email_subject,
      status: row.status,
      sentAt: row.sent_at,
      closedAt: row.closed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapToRfqSummary(row: any): RfqSummary {
    return {
      id: row.id,
      rfqName: row.rfq_name,
      rfqNumber: row.rfq_number,
      status: row.status,
      itemCount: Array.isArray(row.bom_item_ids) ? row.bom_item_ids.length :
        (row.item_count ? parseInt(row.item_count) : 0),
      vendorCount: Array.isArray(row.vendor_ids) ? row.vendor_ids.length :
        (row.vendor_count ? parseInt(row.vendor_count) : 0),
      responseCount: row.response_count ? parseInt(row.response_count) : 0,
      createdAt: row.created_at,
      sentAt: row.sent_at,
    };
  }

  /**
   * Create RFQ tracking record
   */
  private async createRfqTrackingRecord(rfq: RfqRecord, userId: string, accessToken: string): Promise<void> {
    // Ensure project_id is set - critical for data isolation
    if (!rfq.projectId) {
      throw new BadRequestException('RFQ must have a project_id for tracking');
    }

    // Get vendor and BOM details
    const [vendorDetails, bomDetails] = await Promise.allSettled([
      this.getVendorDetails(rfq.vendorIds, accessToken),
      this.getBomItemDetails(rfq.bomItemIds, accessToken)
    ]);

    const vendors = vendorDetails.status === 'fulfilled' 
      ? vendorDetails.value 
      : rfq.vendorIds.map(id => ({ id, name: 'Unknown Vendor' }));

    const parts = bomDetails.status === 'fulfilled' 
      ? bomDetails.value 
      : rfq.bomItemIds.map(id => ({
          id,
          partNumber: 'Unknown Part',
          description: 'Part details unavailable',
          process: 'Unknown Process'
        }));

    // Create tracking record
    await this.rfqTrackingService.createTracking(userId, accessToken, {
      rfqId: rfq.id,
      projectId: rfq.projectId,
      rfqName: rfq.rfqName,
      rfqNumber: rfq.rfqNumber,
      vendors,
      parts
    });
  }


  /**
   * Get vendor details for tracking
   */
  private async getVendorDetails(vendorIds: string[], accessToken: string): Promise<Array<{
    id: string;
    name: string;
    email?: string;
  }>> {
    const { data, error } = await this.supabaseService
      .getClient(accessToken)
      .from('vendors')
      .select('id, name, company_email')
      .in('id', vendorIds);

    if (error) {
      return vendorIds.map(id => ({ id, name: 'Unknown Vendor' }));
    }

    return data.map(vendor => ({
      id: vendor.id,
      name: vendor.name,
      email: vendor.company_email
    }));
  }

  /**
   * Get BOM item details for tracking
   */
  private async getBomItemDetails(bomItemIds: string[], accessToken: string): Promise<Array<{
    id: string;
    partNumber: string;
    description: string;
    process: string;
    quantity?: number;
    file2dPath?: string;
    file3dPath?: string;
  }>> {
    const { data, error } = await this.supabaseService
      .getClient(accessToken)
      .from('bom_items')
      .select('id, name, part_number, description, item_type, quantity, file_3d_path, file_2d_path')
      .in('id', bomItemIds);

    if (error) {
      return bomItemIds.map(id => ({
        id,
        partNumber: 'Unknown Part',
        description: 'Part details unavailable',
        process: 'Unknown Process'
      }));
    }

    return data.map(item => {
      // Map item_type to process
      const processMapping: Record<string, string> = {
        'assembly': 'Assembly',
        'sub_assembly': 'Machining', 
        'child_part': 'Casting'
      };
      
      return {
        id: item.id,
        partNumber: item.part_number || item.name || 'Unknown Part',
        description: item.description || item.name || 'No description available',
        process: processMapping[item.item_type] || 'Manufacturing',
        quantity: item.quantity || 1,
        file2dPath: item.file_2d_path,
        file3dPath: item.file_3d_path
      };
    });
  }
}