import mongoose from "mongoose";

/**
 * Helper function to safely create or retrieve a Mongoose model
 * This prevents the "Cannot overwrite model once compiled" error
 *
 * @param {string} modelName - Name of the model
 * @param {mongoose.Schema} schema - Mongoose schema
 * @returns {mongoose.Model} - Mongoose model
 */
export const getModel = (modelName, schema) => {
  let Model;
  try {
    // Try to retrieve the existing model
    Model = mongoose.model(modelName);
  } catch (error) {
    // Model doesn't exist yet, create it
    Model = mongoose.model(modelName, schema);
  }
  return Model;
};

export default getModel;
