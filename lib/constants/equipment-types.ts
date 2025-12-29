/**
 * Comprehensive Equipment Types Database
 * Organized by manufacturing process categories
 */

export const EQUIPMENT_CATEGORIES = {
  BENDING: 'Bending',
  CASTING: 'Casting',
  CNC_MACHINE: 'CNC Machine',
  CUTTING: 'Cutting',
  FABRICATION: 'Fabrication',
  FINISHING: 'Finishing Options',
  FORGING: 'Forging',
  FORMING: 'Forming',
  GRINDING: 'Grinding',
  HEAT_TREATMENT: 'Heat Treatment',
  HEATING_FURNACE: 'Heating Furnace',
  INJECTION_MOLDING: 'Injection Molding',
  MATERIAL_HANDLING: 'Material Handling',
  MELTING_FURNACE: 'Melting Furnace',
  RAW_MATERIAL: 'Raw Material',
  SHEARING: 'Shearing',
  WELDING: 'Welding',
} as const;

export type EquipmentCategory = typeof EQUIPMENT_CATEGORIES[keyof typeof EQUIPMENT_CATEGORIES];

export interface EquipmentType {
  id: string;
  name: string;
  category: EquipmentCategory;
}

export const EQUIPMENT_TYPES: EquipmentType[] = [
  // Bending
  { id: 'broaching-machine', name: 'Broaching Machine', category: EQUIPMENT_CATEGORIES.BENDING },

  // Casting
  { id: 'casting-machine', name: 'Casting Machine', category: EQUIPMENT_CATEGORIES.CASTING },
  { id: 'die-casting-machine', name: 'Die Casting Machine', category: EQUIPMENT_CATEGORIES.CASTING },
  { id: 'investment-casting', name: 'Investment Casting', category: EQUIPMENT_CATEGORIES.CASTING },
  { id: 'sand-casting', name: 'Sand Casting', category: EQUIPMENT_CATEGORIES.CASTING },

  // CNC Machine
  { id: 'cnc-lathe', name: 'CNC Lathe', category: EQUIPMENT_CATEGORIES.CNC_MACHINE },
  { id: 'conventional-lathe', name: 'Conventional Lathe', category: EQUIPMENT_CATEGORIES.CNC_MACHINE },
  { id: 'drilling-machine', name: 'Drilling Machine', category: EQUIPMENT_CATEGORIES.CNC_MACHINE },
  { id: 'gantry-mill', name: 'Gantry Mill', category: EQUIPMENT_CATEGORIES.CNC_MACHINE },
  { id: 'generic-cnc-machine', name: 'Generic CNC Machine', category: EQUIPMENT_CATEGORIES.CNC_MACHINE },
  { id: 'horizontal-boring-machine', name: 'Horizontal Boring Machine', category: EQUIPMENT_CATEGORIES.CNC_MACHINE },
  { id: 'horizontal-machining-center', name: 'Horizontal Machining Center', category: EQUIPMENT_CATEGORIES.CNC_MACHINE },
  { id: 'laser-cutting', name: 'Laser Cutting', category: EQUIPMENT_CATEGORIES.CNC_MACHINE },
  { id: 'magnetic-drilling-machine', name: 'Magnetic Drilling Machine', category: EQUIPMENT_CATEGORIES.CNC_MACHINE },
  { id: 'milling-machine', name: 'Milling Machine', category: EQUIPMENT_CATEGORIES.CNC_MACHINE },
  { id: 'milling-turning-center', name: 'Milling Turning Center', category: EQUIPMENT_CATEGORIES.CNC_MACHINE },
  { id: 'plasma-cutting', name: 'Plasma Cutting', category: EQUIPMENT_CATEGORIES.CNC_MACHINE },
  { id: 'poly-turn', name: 'Poly Turn', category: EQUIPMENT_CATEGORIES.CNC_MACHINE },
  { id: 'radial-drilling-machine', name: 'Radial Drilling Machine', category: EQUIPMENT_CATEGORIES.CNC_MACHINE },
  { id: 'sliding-head', name: 'Sliding Head', category: EQUIPMENT_CATEGORIES.CNC_MACHINE },
  { id: 'swiss-lathe', name: 'Swiss Lathe', category: EQUIPMENT_CATEGORIES.CNC_MACHINE },
  { id: 'tapping-machine', name: 'Tapping Machine', category: EQUIPMENT_CATEGORIES.CNC_MACHINE },
  { id: 'vertical-boring-machine', name: 'Vertical Boring Machine', category: EQUIPMENT_CATEGORIES.CNC_MACHINE },
  { id: 'vertical-lathe', name: 'Vertical Lathe', category: EQUIPMENT_CATEGORIES.CNC_MACHINE },
  { id: 'vertical-machining-center', name: 'Vertical Machining Center', category: EQUIPMENT_CATEGORIES.CNC_MACHINE },
  { id: 'vertical-machining-center-4-axis', name: 'Vertical Machining Center 4 Axis', category: EQUIPMENT_CATEGORIES.CNC_MACHINE },
  { id: 'vertical-machining-center-5-axis', name: 'Vertical Machining Center 5 Axis', category: EQUIPMENT_CATEGORIES.CNC_MACHINE },
  { id: 'water-jet-cutting', name: 'Water Jet Cutting', category: EQUIPMENT_CATEGORIES.CNC_MACHINE },
  { id: 'wire-cutting', name: 'Wire Cutting', category: EQUIPMENT_CATEGORIES.CNC_MACHINE },

  // Cutting
  { id: 'band-saw', name: 'Band Saw', category: EQUIPMENT_CATEGORIES.CUTTING },
  { id: 'circular-saw', name: 'Circular Saw', category: EQUIPMENT_CATEGORIES.CUTTING },
  { id: 'power-saw', name: 'Power Saw', category: EQUIPMENT_CATEGORIES.CUTTING },

  // Fabrication
  { id: 'press-brake', name: 'Press Brake', category: EQUIPMENT_CATEGORIES.FABRICATION },
  { id: 'rolling-machine', name: 'Rolling Machine', category: EQUIPMENT_CATEGORIES.FABRICATION },

  // Finishing Options
  { id: 'blast-cleaning', name: 'Blast Cleaning', category: EQUIPMENT_CATEGORIES.FINISHING },
  { id: 'buffing-machine', name: 'Buffing Machine', category: EQUIPMENT_CATEGORIES.FINISHING },
  { id: 'deburring-machine', name: 'Deburring Machine', category: EQUIPMENT_CATEGORIES.FINISHING },
  { id: 'painting-booth', name: 'Painting Booth', category: EQUIPMENT_CATEGORIES.FINISHING },
  { id: 'polishing-machine', name: 'Polishing Machine', category: EQUIPMENT_CATEGORIES.FINISHING },
  { id: 'powder-coating', name: 'Powder Coating', category: EQUIPMENT_CATEGORIES.FINISHING },

  // Forging
  { id: 'forging-hammer', name: 'Forging Hammer', category: EQUIPMENT_CATEGORIES.FORGING },
  { id: 'forging-press', name: 'Forging Press', category: EQUIPMENT_CATEGORIES.FORGING },
  { id: 'hot-forging-machine', name: 'Hot Forging Machine', category: EQUIPMENT_CATEGORIES.FORGING },
  { id: 'cold-forging-machine', name: 'Cold Forging Machine', category: EQUIPMENT_CATEGORIES.FORGING },

  // Forming
  { id: 'hydraulic-press', name: 'Hydraulic Press', category: EQUIPMENT_CATEGORIES.FORMING },
  { id: 'mechanical-press', name: 'Mechanical Press', category: EQUIPMENT_CATEGORIES.FORMING },
  { id: 'power-press', name: 'Power Press', category: EQUIPMENT_CATEGORIES.FORMING },
  { id: 'stamping-press', name: 'Stamping Press', category: EQUIPMENT_CATEGORIES.FORMING },

  // Grinding
  { id: 'centerless-grinding', name: 'Centerless Grinding', category: EQUIPMENT_CATEGORIES.GRINDING },
  { id: 'cylindrical-grinding', name: 'Cylindrical Grinding', category: EQUIPMENT_CATEGORIES.GRINDING },
  { id: 'surface-grinding', name: 'Surface Grinding', category: EQUIPMENT_CATEGORIES.GRINDING },
  { id: 'tool-grinding', name: 'Tool Grinding', category: EQUIPMENT_CATEGORIES.GRINDING },

  // Heat Treatment
  { id: 'annealing-furnace', name: 'Annealing Furnace', category: EQUIPMENT_CATEGORIES.HEAT_TREATMENT },
  { id: 'hardening-furnace', name: 'Hardening Furnace', category: EQUIPMENT_CATEGORIES.HEAT_TREATMENT },
  { id: 'normalizing-furnace', name: 'Normalizing Furnace', category: EQUIPMENT_CATEGORIES.HEAT_TREATMENT },
  { id: 'tempering-furnace', name: 'Tempering Furnace', category: EQUIPMENT_CATEGORIES.HEAT_TREATMENT },

  // Heating Furnace
  { id: 'electric-furnace', name: 'Electric Furnace', category: EQUIPMENT_CATEGORIES.HEATING_FURNACE },
  { id: 'gas-furnace', name: 'Gas Furnace', category: EQUIPMENT_CATEGORIES.HEATING_FURNACE },
  { id: 'induction-furnace', name: 'Induction Furnace', category: EQUIPMENT_CATEGORIES.HEATING_FURNACE },

  // Injection Molding
  { id: 'injection-molding-machine', name: 'Injection Molding Machine', category: EQUIPMENT_CATEGORIES.INJECTION_MOLDING },
  { id: 'blow-molding-machine', name: 'Blow Molding Machine', category: EQUIPMENT_CATEGORIES.INJECTION_MOLDING },

  // Material Handling
  { id: 'overhead-crane', name: 'Overhead Crane', category: EQUIPMENT_CATEGORIES.MATERIAL_HANDLING },
  { id: 'forklift', name: 'Forklift', category: EQUIPMENT_CATEGORIES.MATERIAL_HANDLING },
  { id: 'conveyor-system', name: 'Conveyor System', category: EQUIPMENT_CATEGORIES.MATERIAL_HANDLING },

  // Melting Furnace
  { id: 'arc-furnace', name: 'Arc Furnace', category: EQUIPMENT_CATEGORIES.MELTING_FURNACE },
  { id: 'cupola-furnace', name: 'Cupola Furnace', category: EQUIPMENT_CATEGORIES.MELTING_FURNACE },

  // Shearing
  { id: 'guillotine-shear', name: 'Guillotine Shear', category: EQUIPMENT_CATEGORIES.SHEARING },
  { id: 'hydraulic-shear', name: 'Hydraulic Shear', category: EQUIPMENT_CATEGORIES.SHEARING },

  // Welding
  { id: 'arc-welding', name: 'Arc Welding', category: EQUIPMENT_CATEGORIES.WELDING },
  { id: 'mig-welding', name: 'MIG Welding', category: EQUIPMENT_CATEGORIES.WELDING },
  { id: 'tig-welding', name: 'TIG Welding', category: EQUIPMENT_CATEGORIES.WELDING },
  { id: 'spot-welding', name: 'Spot Welding', category: EQUIPMENT_CATEGORIES.WELDING },
  { id: 'robotic-welding', name: 'Robotic Welding', category: EQUIPMENT_CATEGORIES.WELDING },
];

// Helper function to get equipment types by category
export const getEquipmentTypesByCategory = (category: EquipmentCategory): EquipmentType[] => {
  return EQUIPMENT_TYPES.filter(type => type.category === category);
};

// Helper function to get all categories
export const getAllCategories = (): EquipmentCategory[] => {
  return Object.values(EQUIPMENT_CATEGORIES);
};

// Helper function to search equipment types
export const searchEquipmentTypes = (query: string): EquipmentType[] => {
  const lowerQuery = query.toLowerCase();
  return EQUIPMENT_TYPES.filter(
    type =>
      type.name.toLowerCase().includes(lowerQuery) ||
      type.category.toLowerCase().includes(lowerQuery)
  );
};
