import { Document, Model, Mongoose, Schema } from 'mongoose';
import ServiceContainer from '../services/service-container';
import Attributes from './model';

export enum UserCategory {
  Doctor = 'doctor',
  Veterinarian = 'veterinarian' ,
  Nurse = 'nurse',
  Pharmacist = 'pharmacist'
}

export class Address {
  firstAddressField: string;
  secondAddressField: string;
  thirdAddressField: string;
  city: string;
  zipCode: string;
  country: string
}
/**
 * User attributes.
 */
export interface UserAttributes extends Attributes {
  email: string;
  name: string;
  password: string;
  userCategory: UserCategory;
  phone: string;
  department: string;
  address: Address;
  refreshToken?: string;
}

/**
 * User instance.
 */
export interface UserInstance extends UserAttributes, Document {}

/**
 * Creates the user model.
 * 
 * @param container Services container
 * @param mongoose Mongoose instance
 */
export default function createModel(container: ServiceContainer, mongoose: Mongoose): Model<UserInstance> {
  return mongoose.model('User', createUserSchema(container), 'users');
}

/**
 * Creates the user schema.
 * 
 * @param container Services container
 * @returns User schema
 */
function createUserSchema(container: ServiceContainer) {
  const schema = new Schema({
    email: {
      type: Schema.Types.String,
      required: [true, 'Email is required'],
      unique: true,
      validate: {
        validator: (email: string) => /\S+@\S+\.\S+/.test(email),
        message: 'Invalid email'
      }
    },
    name: {
      type: Schema.Types.String,
      required: [true, 'Name is required'],
      unique: [true, 'Name already exists']
    },
    password: {
      type: Schema.Types.String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password is too small'],
      select: false
    },
    userCategory: {
      type: Object.assign(UserCategory),
      required: [true, 'Category required'],
    },
    phone: {
      type: Schema.Types.String,
      unique: true,
      validate: {
        validator: (phone: string) => /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/.test(phone),
        message: 'Invalid phone'
      }
    },
    departments: {
      type: Schema.Types.String,
    },
    address: {
      type: Object.assign(Address),
    },
    refreshToken: {
      type: Schema.Types.String,
      default: null,
      select: false
    }
  }, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });

  // Password hash validation
  schema.pre('save', async function (this: UserInstance, next) {
    if (this.isNew && this.password != null) { // Validates the password only if filled
      try {
        this.password = await container.crypto.hash(this.password, parseInt(process.env.HASH_SALT, 10));
        return next();
      } catch (err) {
        return next(err);
      }
    }
  });

  return schema;
}
