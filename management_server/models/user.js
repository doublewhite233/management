'use strict';

import mongoose from 'mongoose'

const Schema = mongoose.Schema

const userSchema = new Schema({
  mail: { type: String, required: true }, // 通过邮箱登录
  password: { type: String, required: true },
  username: { type: String },
  role: { type: String, default: '1', enum: ['0', '1'] } // 用户身份：0-admin, 1-普通用户 
})

const User = mongoose.model('User', userSchema)

export default User