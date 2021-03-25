'use strict';

import ProjectModel from '../models/project.js'
import UserModel from '../models/user.js'

class project_controller {
  // 获取项目信息
  async getData(req, res, next) {
    // 获取skip和sort、search
    let skip = 0
    const sort = {}
    const search = { col: '', text: '' }
    if (req.query.skip && Number(req.query.skip) !== NaN) skip = Number(req.query.skip)
    if (req.query.sort && typeof(req.query.sort) === 'string') {
      sort[req.query.sort] = -1
    } else {
      sort['update_at'] = -1
    }
    if (req.query.order && Number(req.query.order) !== NaN) sort[req.query.sort] = Number(req.query.order)
    if (req.query.searchcol && req.query.searchtext) {
      search.col = req.query.searchcol
      search.text = req.query.searchtext
    }
    const totalCount = await ProjectModel.countDocuments()
    if (search.col !== 'leader') {
      const total = await ProjectModel.find(search.col !== '' && search.query !== '' ? { [search.col]: { $regex: search.text }} : null).countDocuments()
      const query = ProjectModel.find(search.col !== '' && search.query !== '' ? { [search.col]: { $regex: search.text }} : null).populate('leader', 'username mail').skip(skip).sort(sort)
      query.limit(10).exec(async (err, data) => {
        if (data) {
          res.send({ code: 0, data, total, totalCount })
        } else {
          res.send({ code: 1, data: 'error' })
        }
      })
    } else {
      // 查询匹配的id
      const ids = []
      const idRes = await UserModel.find({ username: { $regex: search.text }}, '_id' )
      idRes.forEach(i => ids.push(i._id))
      const total = await ProjectModel.find(search.col !== '' && search.query !== '' ? { [search.col]: { $in: ids }} : null).countDocuments()
      const query = ProjectModel.find(search.col !== '' && search.query !== '' ? { [search.col]: { $in: ids }} : null).populate('leader', 'username mail').skip(skip).sort(sort)
      query.limit(10).exec(async (err, data) => {
        if (data) {
          res.send({ code: 0, data, totalCount, total })
        } else {
          console.log(err)
          res.send({ code: 1, data: 'error' })
        }
      })
    }
  }
  // 新建项目
  async create(req, res, next) {
    const { name, desc, tag, leader } = req.body
    new ProjectModel({ name, desc, tag, leader, create_at: new Date(), update_at: new Date() }).save((err, data) => {
      if (data) {
        res.send({ code: 0, data: '新建项目成功！' })
      } else {
        res.send({ code: 1, data: 'error' })
      }
    })
  }
  // 删除项目
  async delete(req, res, next) {
    // todo 删除时需要把所有问题同样删除
    const { _id } = req.body
    ProjectModel.remove({ _id }, (err, doc) => {
      if (doc) {
        res.send({ code: 0, data: '删除项目成功！' })
      } else {
        res.send({ code: 1, data: 'error' })
      }
    })
  }
  // 修改项目
  async update(req, res, next) {
    const { _id } = req.body
    ProjectModel.findByIdAndUpdate({ _id }, { ... req.body, update_at: new Date() }, (err, oldDoc) => {
      if (oldDoc) {
        console.log(oldDoc)
        res.send({ code: 0, data: '修改项目成功！' })
      } else {
        res.send({ code: 1, data: 'error' })
      }
    })
  }
  // 获取项目标签
  async getTag(req, res, next) {
    ProjectModel.aggregate([
      {
        $group: { _id: '$tag' }
      }
    ], (err, data) => {
      if (data) {
        const tags = []
        data.forEach(i => {
          i._id.forEach(tag => {
            if (!tags.includes(tag)) {
              tags.push(tag)
            }
          })
        })
        res.send({ code: 0, data: tags })
      } else {
        res.send({ code: 1, data: 'error' })
      }
    })
  }
}

export default new project_controller()