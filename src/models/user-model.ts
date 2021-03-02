import { Document, Model, Mongoose, Schema } from 'mongoose';
import ServiceContainer from '../services/service-container';
import Attributes from './model';
import moment from 'moment';

export enum UserCategoryList {
  Doctor = 'doctor',
  Veterinarian = 'veterinarian',
  Nurse = 'nurse',
  Pharmacist = 'pharmacist',
}

export enum UserCategoryDetailList {
  Practicing = 'practicing',
  inStudy = 'in study',
}

export interface Address {
  firstAddressField: string;
  secondAddressField: string;
  thirdAddressField: string;
  city: string;
  zipCode: string;
  country: string;
}
export interface Identity {
  firstName: string;
  lastName: string;
  birthdayAt: Date;
}

export interface UserCategory {
  mainCategory: UserCategoryList;
  detailCategory: UserCategoryDetailList;
}
/**
 * User attributes.
 */
export interface UserAttributes extends Attributes {
  identity: Identity;
  email: string;
  password: string;
  userCategory: UserCategory;
  phone: string;
  department: string;
  address?: Address;
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
    identity: {
      type: createIdentitySubSchema(container),
      required: [true, 'identity is required'],
    },
    email: {
      type: Schema.Types.String,
      required: [true, 'Email is required'],
      unique: true,
      validate: {
        validator: (email: string) => /\S+@\S+\.\S+/.test(email),
        message: 'Invalid email'
      }
    },
    password: {
      type: Schema.Types.String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password is too small'],
      select: false
    },
    userCategory: {
      type: createUserCategorySubSchema(container),
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
      type: createAddressSubSchema(container),
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

/**
 * Creates the attachment subschema.
 * 
 * @returns Attachment subschema
 */
function createIdentitySubSchema(container: ServiceContainer) {
  const schema = new Schema({
    firstName: {
      type: Schema.Types.String,
      required: [true, 'firstName is required'],
      minlength: [2, 'firstName is too small']
    },
    lastName: {
      type: Schema.Types.String,
      required: [true, 'lastName is required'],
      minlength: [2, 'lastName is too small']
    },
    birthdayAt: {
      type: Schema.Types.Date,
      required: [true, 'birthday is required'],
      validate: [ {
          validator: (date: Date) => moment(date).isSameOrBefore(new Date()),
          message: 'Date can\'t be superior of today'
      }]
    },
  }, {
      _id: false,
      id: false
  });
  return schema;
}


/**
 * Creates the attachment subschema.
 * 
 * @returns Attachment subschema
 */
function createUserCategorySubSchema(container: ServiceContainer) {
  const schema = new Schema({
    mainCategory: {
      type: Schema.Types.String,
      enum: Object.keys(UserCategoryList),
      required: [true, 'main Category required'],
    },
    detailCategory: {
      type: Schema.Types.String,
      enum: Object.keys(UserCategoryDetailList),
      required: [true, 'Category second required'],
    },
  }, {
      _id: false,
      id: false
  });
  return schema;
}


/**
 * Creates the attachment subschema.
 * 
 * @returns Attachment subschema
 */
function createAddressSubSchema(container: ServiceContainer) {
  const schema = new Schema({
    firstAddressField: {
      type: Schema.Types.String,
    },
    secondAddressField: {
      type: Schema.Types.String,
    },
    thirdAddressField: {
      type: Schema.Types.String,
    },
    city: {
      type: Schema.Types.String,
    },
    zipCode: {
      type: Schema.Types.String,
    },
    country: {
      type: Schema.Types.String,
    },
  }, {
      _id: false,
      id: false
  });
  return schema;
}
