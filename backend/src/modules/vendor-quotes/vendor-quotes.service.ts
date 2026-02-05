import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectKnex, Knex } from 'nestjs-knex';
import { CreateVendorQuoteDto, UpdateVendorQuoteDto, VendorQuoteLineItemDto, VendorAssignmentDto } from './dto/vendor-quotes.dto';

@Injectable()
export class VendorQuotesService {
  constructor(@InjectKnex() private readonly knex: Knex) { }

  async createQuote(createQuoteDto: CreateVendorQuoteDto, userId: string) {
    const trx = await this.knex.transaction();

    try {
      // Verify nomination access
      const nomination = await trx('supplier_nomination_evaluations')
        .where({ id: createQuoteDto.nominationEvaluationId, user_id: userId })
        .first();

      if (!nomination) {
        throw new ForbiddenException('Access denied to this nomination');
      }

      // Create quote
      const [quote] = await trx('vendor_quotes')
        .insert({
          nomination_evaluation_id: createQuoteDto.nominationEvaluationId,
          vendor_id: createQuoteDto.vendorId,
          quote_number: createQuoteDto.quoteNumber,
          quote_date: createQuoteDto.quoteDate || new Date(),
          valid_until: createQuoteDto.validUntil,
          currency: createQuoteDto.currency || 'INR',
          payment_terms: createQuoteDto.paymentTerms,
          delivery_terms: createQuoteDto.deliveryTerms,
          warranty_terms: createQuoteDto.warrantyTerms,
          special_conditions: createQuoteDto.specialConditions,
          contact_person: createQuoteDto.contactPerson,
          contact_email: createQuoteDto.contactEmail,
          contact_phone: createQuoteDto.contactPhone,
          internal_notes: createQuoteDto.internalNotes,
          user_id: userId,
        })
        .returning('*');

      // Add line items if provided
      if (createQuoteDto.lineItems && createQuoteDto.lineItems.length > 0) {
        const lineItemsData = createQuoteDto.lineItems.map((item, index) => ({
          vendor_quote_id: quote.id,
          bom_item_id: item.bomItemId,
          line_number: item.lineNumber || (index + 1),
          part_description: item.partDescription,
          unit_price: item.unitPrice,
          quantity: item.quantity,
          total_price: item.totalPrice || (item.unitPrice * item.quantity),
          lead_time_days: item.leadTimeDays,
          delivery_date: item.deliveryDate,
          production_capacity_per_month: item.productionCapacityPerMonth,
          minimum_order_quantity: item.minimumOrderQuantity,
          material_grade: item.materialGrade,
          finish_specification: item.finishSpecification,
          quality_standard: item.qualityStandard,
          certification_requirements: item.certificationRequirements,
          packaging_requirement: item.packagingRequirement,
          tooling_cost: item.toolingCost || 0,
          setup_cost: item.setupCost || 0,
          shipping_cost: item.shippingCost || 0,
          handling_cost: item.handlingCost || 0,
          price_validity_days: item.priceValidityDays || 30,
          payment_terms_override: item.paymentTermsOverride,
          warranty_period_months: item.warrantyPeriodMonths || 12,
          remarks: item.remarks,
          technical_notes: item.technicalNotes,
          compliance_notes: item.complianceNotes,
          risk_assessment: item.riskAssessment,
        }));

        await trx('vendor_quote_line_items').insert(lineItemsData);
      }

      await trx.commit();

      // Return complete quote with line items
      return this.getQuoteById(quote.id, userId);
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  async getQuotesByNomination(nominationId: string, userId: string, status?: string) {
    // Verify nomination access
    const nomination = await this.knex('supplier_nomination_evaluations')
      .where({ id: nominationId, user_id: userId })
      .first();

    if (!nomination) {
      throw new ForbiddenException('Access denied to this nomination');
    }

    let query = this.knex('vendor_quotes as vq')
      .select([
        'vq.*',
        'v.name as vendor_name',
        'v.supplier_code',
        'v.contact_person as vendor_contact_person',
        'v.contact_email as vendor_contact_email',
        'v.contact_phone as vendor_contact_phone',
      ])
      .leftJoin('vendors as v', 'v.id', 'vq.vendor_id')
      .where('vq.nomination_evaluation_id', nominationId)
      .orderBy('vq.created_at', 'desc');

    if (status) {
      query = query.where('vq.status', status);
    }

    return query;
  }

  async getQuoteById(id: string, userId: string) {
    // Get quote with vendor details
    const quote = await this.knex('vendor_quotes as vq')
      .select([
        'vq.*',
        'v.name as vendor_name',
        'v.supplier_code',
        'v.contact_person as vendor_contact_person',
        'v.contact_email as vendor_contact_email',
        'v.contact_phone as vendor_contact_phone',
        'sne.nomination_name',
      ])
      .leftJoin('vendors as v', 'v.id', 'vq.vendor_id')
      .leftJoin('supplier_nomination_evaluations as sne', 'sne.id', 'vq.nomination_evaluation_id')
      .where('vq.id', id)
      .first();

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    // Verify access
    const nomination = await this.knex('supplier_nomination_evaluations')
      .where({ id: quote.nomination_evaluation_id, user_id: userId })
      .first();

    if (!nomination) {
      throw new ForbiddenException('Access denied to this quote');
    }

    // Get line items
    const lineItems = await this.knex('vendor_quote_line_items as qli')
      .select([
        'qli.*',
        'bi.name as bom_item_name',
        'bi.part_number',
      ])
      .leftJoin('bom_items as bi', 'bi.id', 'qli.bom_item_id')
      .where('qli.vendor_quote_id', id)
      .orderBy('qli.line_number');

    return {
      ...quote,
      line_items: lineItems,
    };
  }

  async updateQuote(id: string, updateQuoteDto: UpdateVendorQuoteDto, userId: string) {
    const quote = await this.getQuoteById(id, userId);

    // Don't allow updates if quote is approved
    if (quote.status === 'approved') {
      throw new BadRequestException('Cannot modify approved quotes');
    }

    const [updatedQuote] = await this.knex('vendor_quotes')
      .where({ id })
      .update({
        ...updateQuoteDto,
        updated_at: new Date(),
      })
      .returning('*');

    return this.getQuoteById(id, userId);
  }

  async deleteQuote(id: string, userId: string) {
    const quote = await this.getQuoteById(id, userId);

    // Don't allow deletion if quote is approved
    if (quote.status === 'approved') {
      throw new BadRequestException('Cannot delete approved quotes');
    }

    await this.knex('vendor_quotes').where({ id }).delete();

    return { message: 'Quote deleted successfully' };
  }

  async addLineItem(quoteId: string, lineItemDto: VendorQuoteLineItemDto, userId: string) {
    const quote = await this.getQuoteById(quoteId, userId);

    // Get next line number
    const lastLineItem = await this.knex('vendor_quote_line_items')
      .where({ vendor_quote_id: quoteId })
      .orderBy('line_number', 'desc')
      .first();

    const lineNumber = lineItemDto.lineNumber || (lastLineItem ? lastLineItem.line_number + 1 : 1);

    const [lineItem] = await this.knex('vendor_quote_line_items')
      .insert({
        vendor_quote_id: quoteId,
        bom_item_id: lineItemDto.bomItemId,
        line_number: lineNumber,
        part_description: lineItemDto.partDescription,
        unit_price: lineItemDto.unitPrice,
        quantity: lineItemDto.quantity,
        total_price: lineItemDto.totalPrice || (lineItemDto.unitPrice * lineItemDto.quantity),
        lead_time_days: lineItemDto.leadTimeDays,
        delivery_date: lineItemDto.deliveryDate,
        production_capacity_per_month: lineItemDto.productionCapacityPerMonth,
        minimum_order_quantity: lineItemDto.minimumOrderQuantity,
        material_grade: lineItemDto.materialGrade,
        finish_specification: lineItemDto.finishSpecification,
        quality_standard: lineItemDto.qualityStandard,
        certification_requirements: lineItemDto.certificationRequirements,
        packaging_requirement: lineItemDto.packagingRequirement,
        tooling_cost: lineItemDto.toolingCost || 0,
        setup_cost: lineItemDto.setupCost || 0,
        shipping_cost: lineItemDto.shippingCost || 0,
        handling_cost: lineItemDto.handlingCost || 0,
        price_validity_days: lineItemDto.priceValidityDays || 30,
        payment_terms_override: lineItemDto.paymentTermsOverride,
        warranty_period_months: lineItemDto.warrantyPeriodMonths || 12,
        remarks: lineItemDto.remarks,
        technical_notes: lineItemDto.technicalNotes,
        compliance_notes: lineItemDto.complianceNotes,
        risk_assessment: lineItemDto.riskAssessment,
      })
      .returning('*');

    return lineItem;
  }

  async updateLineItem(quoteId: string, lineItemId: string, lineItemDto: VendorQuoteLineItemDto, userId: string) {
    const quote = await this.getQuoteById(quoteId, userId);

    const [updatedLineItem] = await this.knex('vendor_quote_line_items')
      .where({ id: lineItemId, vendor_quote_id: quoteId })
      .update({
        ...lineItemDto,
        total_price: lineItemDto.totalPrice || (lineItemDto.unitPrice * lineItemDto.quantity),
        updated_at: new Date(),
      })
      .returning('*');

    if (!updatedLineItem) {
      throw new NotFoundException('Line item not found');
    }

    return updatedLineItem;
  }

  async deleteLineItem(quoteId: string, lineItemId: string, userId: string) {
    const quote = await this.getQuoteById(quoteId, userId);

    await this.knex('vendor_quote_line_items')
      .where({ id: lineItemId, vendor_quote_id: quoteId })
      .delete();

    return { message: 'Line item deleted successfully' };
  }

  async submitQuote(id: string, userId: string) {
    const quote = await this.getQuoteById(id, userId);

    if (quote.status !== 'draft') {
      throw new BadRequestException('Only draft quotes can be submitted');
    }

    const [updatedQuote] = await this.knex('vendor_quotes')
      .where({ id })
      .update({
        status: 'submitted',
        updated_at: new Date(),
      })
      .returning('*');

    return updatedQuote;
  }

  async approveQuote(id: string, userId: string, reviewNotes?: string) {
    const quote = await this.getQuoteById(id, userId);

    if (quote.status !== 'submitted') {
      throw new BadRequestException('Only submitted quotes can be approved');
    }

    const [updatedQuote] = await this.knex('vendor_quotes')
      .where({ id })
      .update({
        status: 'approved',
        reviewed_by: userId,
        review_notes: reviewNotes,
        updated_at: new Date(),
      })
      .returning('*');

    return updatedQuote;
  }

  async rejectQuote(id: string, userId: string, reviewNotes: string) {
    const quote = await this.getQuoteById(id, userId);

    if (quote.status !== 'submitted') {
      throw new BadRequestException('Only submitted quotes can be rejected');
    }

    const [updatedQuote] = await this.knex('vendor_quotes')
      .where({ id })
      .update({
        status: 'rejected',
        reviewed_by: userId,
        review_notes: reviewNotes,
        updated_at: new Date(),
      })
      .returning('*');

    return updatedQuote;
  }

  async compareQuotesForBomItem(nominationId: string, bomItemId: string, userId: string) {
    // Verify access
    const nomination = await this.knex('supplier_nomination_evaluations')
      .where({ id: nominationId, user_id: userId })
      .first();

    if (!nomination) {
      throw new ForbiddenException('Access denied to this nomination');
    }

    const quotes = await this.knex('vendor_quote_comparison')
      .where({
        nomination_id: nominationId,
        bom_item_id: bomItemId,
      })
      .orderBy('unit_price', 'asc');

    return {
      nomination_id: nominationId,
      bom_item_id: bomItemId,
      quotes,
      summary: {
        total_quotes: quotes.length,
        lowest_price: quotes.length > 0 ? Math.min(...quotes.map((q: any) => q.unit_price)) : null,
        highest_price: quotes.length > 0 ? Math.max(...quotes.map((q: any) => q.unit_price)) : null,
        fastest_delivery: quotes.length > 0 ? Math.min(...quotes.map((q: any) => q.lead_time_days)) : null,
        slowest_delivery: quotes.length > 0 ? Math.max(...quotes.map((q: any) => q.lead_time_days)) : null,
      },
    };
  }

  async assignVendorToBomPart(assignmentDto: VendorAssignmentDto, userId: string) {
    const trx = await this.knex.transaction();

    try {
      // Verify access to nomination
      const nomination = await trx('supplier_nomination_evaluations')
        .where({ id: assignmentDto.nominationId, user_id: userId })
        .first();

      if (!nomination) {
        throw new ForbiddenException('Access denied to this nomination');
      }

      // Get BOM part in nomination
      const bomPart = await trx('supplier_nomination_bom_parts')
        .where({
          nomination_evaluation_id: assignmentDto.nominationId,
          bom_item_id: assignmentDto.bomItemId,
        })
        .first();

      if (!bomPart) {
        throw new NotFoundException('BOM part not found in nomination');
      }

      // Get quote line item if provided
      let quoteLineItem = null;
      if (assignmentDto.quoteLineItemId) {
        quoteLineItem = await trx('vendor_quote_line_items as qli')
          .select(['qli.*', 'vq.vendor_id'])
          .join('vendor_quotes as vq', 'vq.id', 'qli.vendor_quote_id')
          .where({
            'qli.id': assignmentDto.quoteLineItemId,
            'qli.bom_item_id': assignmentDto.bomItemId,
            'vq.nomination_evaluation_id': assignmentDto.nominationId,
          })
          .first();

        if (!quoteLineItem) {
          throw new NotFoundException('Quote line item not found');
        }

        // Verify vendor matches
        if (quoteLineItem.vendor_id !== assignmentDto.vendorId) {
          throw new BadRequestException('Quote line item does not belong to specified vendor');
        }
      }

      // Check if assignment already exists
      const existingAssignment = await trx('supplier_nomination_bom_part_vendors')
        .where({
          nomination_bom_part_id: bomPart.id,
          vendor_id: assignmentDto.vendorId,
        })
        .first();

      const assignmentData = {
        nomination_bom_part_id: bomPart.id,
        vendor_id: assignmentDto.vendorId,
        selected_quote_line_item_id: assignmentDto.quoteLineItemId,
        quoted_unit_price: assignmentDto.quotedUnitPrice || quoteLineItem?.unit_price,
        quoted_total_price: assignmentDto.quotedTotalPrice || quoteLineItem?.total_price,
        quoted_delivery_date: assignmentDto.quotedDeliveryDate || quoteLineItem?.delivery_date,
        quoted_lead_time_days: assignmentDto.quotedLeadTimeDays || quoteLineItem?.lead_time_days,
        assignment_reason: assignmentDto.assignmentReason,
        selection_status: assignmentDto.selectionStatus || 'selected',
        selected_at: new Date(),
        selected_by: userId,
        updated_at: new Date(),
      };

      let assignment;
      if (existingAssignment) {
        [assignment] = await trx('supplier_nomination_bom_part_vendors')
          .where({ id: existingAssignment.id })
          .update(assignmentData)
          .returning('*');
      } else {
        [assignment] = await trx('supplier_nomination_bom_part_vendors')
          .insert({
            ...assignmentData,
            created_at: new Date(),
          })
          .returning('*');
      }

      await trx.commit();

      // Return full assignment with related data
      return this.getVendorAssignmentById(assignment.id, userId);
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  async getVendorAssignments(nominationId: string, userId: string) {
    // Verify access
    const nomination = await this.knex('supplier_nomination_evaluations')
      .where({ id: nominationId, user_id: userId })
      .first();

    if (!nomination) {
      throw new ForbiddenException('Access denied to this nomination');
    }

    return this.knex('supplier_nomination_bom_part_vendors as snbpv')
      .select([
        'snbpv.*',
        'snbp.bom_item_id',
        'snbp.bom_item_name',
        'snbp.part_number',
        'snbp.material',
        'snbp.quantity as required_quantity',
        'v.name as vendor_name',
        'v.supplier_code',
        'v.contact_person',
        'v.contact_email',
        'v.contact_phone',
        'qli.delivery_date as quote_delivery_date',
        'qli.lead_time_days as quote_lead_time',
        'qli.unit_price as quote_unit_price',
        'qli.total_price as quote_total_price',
      ])
      .join('supplier_nomination_bom_parts as snbp', 'snbp.id', 'snbpv.nomination_bom_part_id')
      .join('vendors as v', 'v.id', 'snbpv.vendor_id')
      .leftJoin('vendor_quote_line_items as qli', 'qli.id', 'snbpv.selected_quote_line_item_id')
      .where('snbp.nomination_evaluation_id', nominationId)
      .orderBy('snbp.bom_item_name');
  }

  async getVendorAssignmentById(id: string, userId: string) {
    const assignment = await this.knex('supplier_nomination_bom_part_vendors as snbpv')
      .select([
        'snbpv.*',
        'snbp.nomination_evaluation_id',
        'snbp.bom_item_id',
        'snbp.bom_item_name',
        'snbp.part_number',
        'snbp.material',
        'snbp.quantity as required_quantity',
        'v.name as vendor_name',
        'v.supplier_code',
        'v.contact_person',
        'v.contact_email',
        'v.contact_phone',
        'qli.delivery_date as quote_delivery_date',
        'qli.lead_time_days as quote_lead_time',
        'qli.unit_price as quote_unit_price',
        'qli.total_price as quote_total_price',
        'sne.nomination_name',
      ])
      .join('supplier_nomination_bom_parts as snbp', 'snbp.id', 'snbpv.nomination_bom_part_id')
      .join('supplier_nomination_evaluations as sne', 'sne.id', 'snbp.nomination_evaluation_id')
      .join('vendors as v', 'v.id', 'snbpv.vendor_id')
      .leftJoin('vendor_quote_line_items as qli', 'qli.id', 'snbpv.selected_quote_line_item_id')
      .where('snbpv.id', id)
      .first();

    if (!assignment) {
      throw new NotFoundException('Vendor assignment not found');
    }

    // Verify access
    const nomination = await this.knex('supplier_nomination_evaluations')
      .where({ id: assignment.nomination_evaluation_id, user_id: userId })
      .first();

    if (!nomination) {
      throw new ForbiddenException('Access denied to this assignment');
    }

    return assignment;
  }

  async updateVendorAssignment(assignmentId: string, updateData: Partial<VendorAssignmentDto>, userId: string) {
    const assignment = await this.getVendorAssignmentById(assignmentId, userId);

    const [updatedAssignment] = await this.knex('supplier_nomination_bom_part_vendors')
      .where({ id: assignmentId })
      .update({
        ...updateData,
        updated_at: new Date(),
      })
      .returning('*');

    return this.getVendorAssignmentById(assignmentId, userId);
  }

  async calculateCompetitivenessScores(nominationId: string, bomItemId: string, userId: string) {
    // Verify access
    const nomination = await this.knex('supplier_nomination_evaluations')
      .where({ id: nominationId, user_id: userId })
      .first();

    if (!nomination) {
      throw new ForbiddenException('Access denied to this nomination');
    }

    const scores = await this.knex.raw(
      'SELECT * FROM calculate_vendor_competitiveness_scores(?, ?)',
      [nominationId, bomItemId]
    );

    return scores.rows;
  }

  async getQuotesDashboard(nominationId: string, userId: string, includeUnquoted: boolean = false) {
    // Verify access
    const nomination = await this.knex('supplier_nomination_evaluations')
      .where({ id: nominationId, user_id: userId })
      .first();

    if (!nomination) {
      throw new ForbiddenException('Access denied to this nomination');
    }

    // Get BOM parts in nomination
    const bomParts = await this.knex('supplier_nomination_bom_parts')
      .where({ nomination_evaluation_id: nominationId })
      .orderBy('bom_item_name');

    // Get vendor assignments
    const assignments = await this.getVendorAssignments(nominationId, userId);

    // Get all quotes for nomination
    const quotes = await this.getQuotesByNomination(nominationId, userId);

    // Calculate summary metrics
    const totalParts = bomParts.length;
    const partsWithQuotes = new Set(assignments.filter((a: any) => a.selected_quote_line_item_id).map((a: any) => a.bom_item_id)).size;
    const partsAssigned = new Set(assignments.filter((a: any) => a.selection_status === 'selected').map((a: any) => a.bom_item_id)).size;

    const totalQuotedAmount = assignments.reduce((sum: number, a: any) => sum + (a.quoted_total_price || 0), 0);
    const averageLeadTime = assignments.length > 0
      ? assignments.reduce((sum: number, a: any) => sum + (a.quoted_lead_time_days || 0), 0) / assignments.length
      : 0;

    return {
      nomination_id: nominationId,
      nomination_name: nomination.nomination_name,
      summary: {
        total_parts: totalParts,
        parts_with_quotes: partsWithQuotes,
        parts_assigned: partsAssigned,
        quote_coverage_percentage: totalParts > 0 ? (partsWithQuotes / totalParts * 100) : 0,
        assignment_percentage: totalParts > 0 ? (partsAssigned / totalParts * 100) : 0,
        total_quoted_amount: totalQuotedAmount,
        average_lead_time: Math.round(averageLeadTime),
        total_quotes: quotes.length,
        pending_assignments: totalParts - partsAssigned,
      },
      bom_parts: bomParts,
      vendor_assignments: assignments,
      quotes: quotes,
    };
  }
}