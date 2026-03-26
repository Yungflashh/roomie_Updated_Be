import { ICosmeticDocument, CosmeticType } from '../models/Cosmetic';
declare class CosmeticService {
    /**
     * Get all active shop items, optionally filtered by type
     */
    getShopItems(type?: CosmeticType): Promise<ICosmeticDocument[]>;
    /**
     * Get user's owned cosmetics with full details
     */
    getInventory(userId: string): Promise<{
        owned: ICosmeticDocument[];
        equipped: Record<string, ICosmeticDocument | null>;
    }>;
    /**
     * Purchase a cosmetic item with points
     */
    purchase(userId: string, cosmeticId: string): Promise<{
        cosmetic: ICosmeticDocument;
        newBalance: number;
    }>;
    /**
     * Equip a cosmetic item
     */
    equip(userId: string, cosmeticId: string): Promise<void>;
    /**
     * Unequip a cosmetic slot
     */
    unequip(userId: string, type: CosmeticType): Promise<void>;
    /**
     * Seed default cosmetics (call once or from admin)
     */
    seedDefaults(): Promise<number>;
}
declare const _default: CosmeticService;
export default _default;
//# sourceMappingURL=cosmetic.service.d.ts.map