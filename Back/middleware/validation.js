import Joi from "joi";
import { ErrorResponse } from "./errorHandler.js";

export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return next(new ErrorResponse(error.details[0].message, 400));
    }
    next();
  };
};

export const schemas = {
  createUser: Joi.object({
    name: Joi.string().required().min(2).max(50).trim(),
    email: Joi.string().email().required().lowercase(),
    password: Joi.string().min(6).max(128).required(),
    cnic: Joi.string().pattern(/^\d{5}-\d{7}-\d$/).required(),
    phone: Joi.string().pattern(/^03[0-9]{9}$/).required(),
    role: Joi.string()
      .valid("admin", "teamlead", "employee")
      .default("employee"),
  }),

  login: Joi.object({
    email: Joi.string().email().required().lowercase(),
    password: Joi.string().required(),
  }),

  createProject: Joi.object({
    projectName: Joi.string().required().max(200).trim(),
    description: Joi.string().max(1000).trim(),
    clientName: Joi.string().required().max(200).trim(),
    clientEmail: Joi.string().email().trim(),
    clientPhone: Joi.string().trim(),
    deadline: Joi.date().greater("now"),
    category: Joi.string().valid("fixed", "hourly", "milestone").required(),
    priority: Joi.string()
      .valid("low", "medium", "high", "urgent")
      .default("medium"),
    fixedAmount: Joi.number().min(0).when("category", {
      is: "fixed",
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    hourlyRate: Joi.number().min(0).when("category", {
      is: "hourly",
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    estimatedHours: Joi.number().min(0),
    milestones: Joi.array().when("category", {
      is: "milestone",
      then: Joi.required().min(1),
      otherwise: Joi.optional(),
    }),
  }),

  createTask: Joi.object({
    title: Joi.string().required().max(200).trim(),
    description: Joi.string().max(1000).trim(),
    specialInstructions: Joi.string().max(500).trim(),
    assignedTo: Joi.string().required().length(24).hex(),
    project: Joi.string().required().length(24).hex(),
    dueDate: Joi.date().greater("now"),
    projectLink: Joi.string().uri(),
  }),

  createAsset: Joi.object({
    name: Joi.string().required().max(100).trim(),
    type: Joi.string()
      .valid("Laptop", "iMac", "Mouse", "Keyboard", "Headphone", "Charger", "Bag")
      .required(),
    brand: Joi.string().max(50).trim(),
    model: Joi.string().max(50).trim(),
    serialNumber: Joi.string().required().max(100).trim(),
    specification: Joi.string().max(500).trim(),
    processor: Joi.when("type", {
      is: Joi.valid("Laptop", "iMac"),
      then: Joi.string().required().max(100),
      otherwise: Joi.optional(),
    }),
    ram: Joi.when("type", {
      is: Joi.valid("Laptop", "iMac"),
      then: Joi.string().required().max(50),
      otherwise: Joi.optional(),
    }),
    rom: Joi.when("type", {
      is: Joi.valid("Laptop", "iMac"),
      then: Joi.string().required().max(50),
      otherwise: Joi.optional(),
    }),
    conditionStatus: Joi.string()
      .valid("good", "bad", "repair", "broken")
      .default("good"),
  }),
};
