import { ObjectId } from 'mongodb';

declare global {
  interface UserDocument extends Document {
    _id: ObjectId;
    name: string;
    email?: string;
    phone?: string;
    createdAt: Date;
    profilePic?: string;
    gallery?: string[];
    updatedAt?: Date;
  }
}