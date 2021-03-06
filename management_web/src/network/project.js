import { request } from './request.js'

export function getProjectData(skip, sort, order, searchcol, searchtext) {
  return request({
    url: '/project/data',
    params: { skip, sort, order, searchcol, searchtext }
  })
}

export function createProject(name, desc, tag, leader) {
  return request({
    url: '/project/create',
    method: 'post',
    data: { name, desc, tag, leader }
  })
}

export function deleteProject(_id) {
  return request({
    url: '/project/delete',
    method: 'post',
    data: { _id }
  })
}

export function updateProject(formData) {
  return request({
    url: '/project/update',
    method: 'post',
    data: { ...formData }
  })
}

export function getTagList() {
  return request({
    url: '/project/gettag'
  })
}

export function getProjectList(query) {
  return request({
    url: '/project/projectlist',
    params: { input: query }
  })
}

export function getProjectDetail(id) {
  return request({
    url: '/project/databyid',
    method: 'post',
    data: { id }
  })
}

export function getTeamInfo(_id) {
  return request({
    url: '/project/team',
    method: 'post',
    data: { _id }
  })
}

export function addTeamMember(project, user) {
  return request({
    url: '/project/addteam',
    method: 'post',
    data: { _id: project, user_id: user }
  })
}

export function deleteTeamMember(project, user) {
  return request({
    url: '/project/deleteteam',
    method: 'post',
    data: { _id: project, user_id: user }
  })
}

export function getMyProject(_id) {
  return request({
    url: '/project/mywork',
    method: 'post',
    data: { _id }
  })
}
