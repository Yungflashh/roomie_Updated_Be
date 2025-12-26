import mongoose, { Document } from 'mongoose';
export interface IAdmin extends Document {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: 'super_admin' | 'admin' | 'moderator';
    isActive: boolean;
    createdAt: Date;
}
declare const _default: mongoose.Model<IAdmin, {}, {}, {}, mongoose.Document<unknown, {}, IAdmin, {}, mongoose.DefaultSchemaOptions> & IAdmin & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IAdmin>;
export default _default;
//# sourceMappingURL=Admin.d.ts.map