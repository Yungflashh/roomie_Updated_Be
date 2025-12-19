import mongoose, { Document } from 'mongoose';
export interface IMediaHashDocument extends Document {
    user: mongoose.Types.ObjectId;
    originalFilename: string;
    fileUrl: string;
    fileType: 'image' | 'video';
    hashes: {
        phash?: string;
        blockhash?: string;
        md5: string;
    };
    dimensions?: {
        width: number;
        height: number;
    };
    size: number;
    uploadedAt: Date;
}
export declare const MediaHash: mongoose.Model<IMediaHashDocument, {}, {}, {}, mongoose.Document<unknown, {}, IMediaHashDocument, {}, mongoose.DefaultSchemaOptions> & IMediaHashDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IMediaHashDocument>;
//# sourceMappingURL=MediaHash.d.ts.map