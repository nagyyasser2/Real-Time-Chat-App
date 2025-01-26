import { Model, Document, Types } from 'mongoose';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export abstract class BaseRepository<T extends Document> {
    constructor(private readonly model: Model<T>) { }

    async findAll(): Promise<T[]> {
        return this.model.find().exec();
    }

    async findById(id: string): Promise<T> {
        const result = await this.model.findById(id).exec();
        if (!result) {
            throw new Error(`Document with id ${id} not found`);
        }
        return result;
    }

    async create(item: Partial<T>): Promise<T> {
        return this.model.create(item);
    }

    async update(id: string, item: Partial<T>): Promise<T> {

        const result = await this.model.findByIdAndUpdate(id, item, { new: true }).exec();
        if (!result) {
            throw new Error(`Document with id ${id} not found`);
        }
        return result;
    }

    async delete(id: string): Promise<T> {

        const result = await this.model.findByIdAndDelete(id).exec();
        if (!result) {
            throw new Error(`Document with id ${id} not found`);
        }
        return result;
    }
}