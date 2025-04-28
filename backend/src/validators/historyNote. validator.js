import Joi from 'joi';

const historyNoteValidator = Joi.object({
  initData: Joi.object().required().messages({
    'any.required': 'Поле initData обязательно',
    'object.base': 'Поле initData должно быть объектом'
  }),

  markup: Joi.number().greater(0).messages({
    'number.base': 'Поле markup должно быть числом',
    'number.greater': 'Поле markup должно быть больше нуля'
  }),

  comments: Joi.string().max(5000).allow('').messages({
    'string.base': 'Поле comments должно быть строкой',
    'string.max': 'Поле comments не должно превышать 5000 символов'
  }),

  type: Joi.string().valid('ballons', 'mattress', 'fbort').required().messages({
    'any.required': 'Поле type обязательно',
    'any.only': 'Поле type должно быть одним из: ballons, mattress, fbort',
    'string.base': 'Поле type должно быть строкой'
  }),

  creatorId: Joi.string().guid({ version: 'uuidv4' }).required().messages({
    'any.required': 'Поле creatorId обязательно',
    'string.guid': 'Поле creatorId должно быть валидным UUID v4',
    'string.base': 'Поле creatorId должно быть строкой'
  })
});

export default historyNoteValidator
