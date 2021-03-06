<template>
  <el-main>
    <div v-if="page.totalCount === 0" style="height: calc(100vh - 151px);">
      <empty>
        <template v-slot:text>
          <div>暂无项目</div>
          <el-button type="primary" @click="handleCreate" style="margin-top:20px">点击创建项目</el-button>
        </template>
      </empty>
    </div>

    <div v-else>
      <el-row type="flex" justify="space-between">
        <el-col :span="10">
          <el-input placeholder="请输入内容" v-model="search.text">
            <el-select v-model="search.col" slot="prepend" placeholder="请选择" style="width: 110px">
              <el-option label="项目名称" value="name" />
              <el-option label="负责人" value="leader" />
              <el-option label="标签" value="tag" />
            </el-select>
            <el-button slot="append" icon="el-icon-search" @click="fetchData"/>
          </el-input>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="handleCreate" style="float: right" :loading="loading">新建项目</el-button>
           <el-button @click="handleShowTypeDia" style="float: right; margin-right: 10px;">配置任务类型</el-button>
        </el-col>
      </el-row>
      <el-table :data="projectData" :default-sort="sort" @sort-change="handleSort">
        <el-table-column prop="name" label="项目名称" align="center" sortable="custom">
          <template slot-scope="scope">
            <el-link @click="clickProject(scope.row._id)" :underline="false">{{ `${scope.row.name}` }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="leader" label="负责人" align="center" sortable="custom">
          <template slot-scope="scope">{{ `${scope.row.leader.username}(${scope.row.leader.mail})` }}</template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="create_at" sortable="custom">
          <template slot-scope="scope">
            {{ getDate(scope.row.create_at) }}
          </template>
        </el-table-column>
        <el-table-column label="更新时间" align="center" prop="update_at" sortable="custom">
          <template slot-scope="scope">
            {{ getDate(scope.row.update_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center">
          <template slot-scope="scope">
            <el-button @click="handleUpdate(scope.row)" size="mini">修改</el-button>
            <el-button @click="handleDelete(scope.row._id)" type="danger" size="mini">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-row type="flex" justify="center" style="margin-top: 10px">
        <el-pagination
          @current-change="fetchData"
          :current-page.sync="page.currentPage"
          :page-size="page.size"
          layout="total, prev, pager, next"
          :total="page.total">
        </el-pagination>
      </el-row>
    </div>

    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="50%">
      <el-form :model="projectForm" :rules="rules" label-position="left" label-width="80px" ref="projectForm" style="padding: 0 20px">
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="projectForm.name" placeholder="请输入项目名称" maxlength="30" show-word-limit />
        </el-form-item>
        <el-form-item label="项目描述">
          <el-input v-model="projectForm.desc" type="textarea" :rows="4" placeholder="请输入项目描述" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="项目标签">
          <el-tag
            v-for="tag in projectForm.tag"
            :key="tag"
            closable
            :disable-transitions="false"
            @close="handleDeleteTag(tag)"
            class="tags">
            {{ tag }}
          </el-tag>
          <span v-if="tagInputVisible">
            <el-select
              v-model="tagInputValue"
              size="small"
              filterable
              allow-create
              default-first-option
              :loading="loading"
              remote
              :remote-method="getTagList"
              @keyup.enter.native="handleInputConfirm"
              class="tags tag-input"
            >
              <el-option v-for="i in tagOption" :key="i" :label="i" :value="i" />
            </el-select>
            <el-button type="primary" size="mini" @click="handleInputConfirm">确认</el-button>
          </span>
          <el-button v-else size="small" @click="showTagInput" class="tags">添加标签</el-button>
        </el-form-item>
        <el-form-item label="负责人" prop="leader">
          <el-select v-model="projectForm.leader" filterable remote :remote-method="getPersonList" :loading="loading" style="width: 100%;" @blur="$refs.projectForm.validateField('leader')">
            <el-option v-for="item in personOption" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </span>
    </el-dialog>

    <el-dialog title="编辑任务类型" :visible.sync="typeDiaVisible" width="50%" center>
      <el-table :data="issueType">
        <el-table-column prop="name" align="center" label="名称">
          <template slot-scope="scope">
            <span v-if="!scope.row.edit">{{ scope.row.name }}</span>
            <el-input v-else v-model="scope.row.name" />
          </template>
        </el-table-column>
        <el-table-column prop="desc" align="center" label="描述">
          <template slot-scope="scope">
            <span v-if="!scope.row.edit">{{ scope.row.desc }}</span>
            <el-input v-else v-model="scope.row.desc" />
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="150">
          <template slot-scope="scope">
            <el-button v-if="!scope.row.edit" @click="handleEditType(scope.$index)" size="mini">修改</el-button>
            <el-button v-else @click="handleSubmitType(scope)" size="mini">保存</el-button>
            <el-button @click="handleDeleteType(scope)" type="danger" size="mini">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <span slot="footer">
        <el-button type="primary" @click="handleCreateType">新建类型</el-button>
      </span>
    </el-dialog>
  </el-main>
</template>

<script>
import { getProjectData, createProject, deleteProject, updateProject, getTagList } from '@/network/project.js'
import { getUserData } from '@/network/user.js'
import { getIssueType, updateIssueType, deleteIssueType } from '@/network/issueType.js'
import { formatDate } from '@/utils/index.js'

import Empty from '@/components/empty/Empty'

export default {
  components: {
    Empty
  },
  data() {
    return {
      loading: false,
      projectData: [],
      page: { total: 1, currentPage: 1, size: 10, totalCount: 0 },
      sort: { prop: 'update_at', order: 'descending' },
      search: { col: '', text: '' },
      dialogVisible: false,
      dialogTitle: '',
      projectForm: { name: '', desc: '', tag: [], leader: '', _id: '', leaderid: '' },
      tagInputVisible: false,
      tagInputValue: '',
      tagList: [],
      tagOption: [],
      personOption: [],
      rules: {
        name: { required: true, message: '请输入项目名称', trigger: 'blur' },
        leader: { required: true, message: '请选择负责人', trigger: ['blur', 'change'] }
      },
      typeDiaVisible: false,
      issueType: []
    }
  },
  mounted() {
    this.fetchData()
  },
  computed: {
    getDate() {
      return (date) => formatDate(date, 'yyyy-MM-dd hh:mm')
    }
  },
  methods: {
    async fetchData() {
      const res = await getProjectData((this.page.currentPage - 1) * this.page.size, this.sort.prop, this.sort.order === 'ascending' ? 1 : -1, this.search.col, this.search.text)
      if (res && res.code === 0) {
        this.projectData = res.data
        this.page.total = res.total
        this.page.totalCount = res.totalCount
        const tagData = await getTagList()
        if (tagData.data) this.tagList = tagData.data
      }
    },

    handleCreate() {
      Object.keys(this.projectForm).forEach(k => {
        if (k === 'tag') {
          this.projectForm[k] = []
        } else {
          this.projectForm[k] = ''
        }
      })
      this.personOption = []
      this.dialogVisible = true
      this.dialogTitle = '新建项目'
      this.$nextTick(() => { this.$refs.projectForm.clearValidate() })
    },
    handleUpdate(data) {
      const tempArr = Object.keys(data)
      Object.keys(this.projectForm).forEach(k => {
        if (tempArr.indexOf(k) !== -1 && k !== 'leader' && k !== 'leaderid') {
          this.projectForm[k] = data[k]
        }
        if (k === 'leader') this.projectForm[k] = `${data[k].username}(${data[k].mail})`
        if (k === 'leaderid') this.projectForm[k] = data.leader._id
      })
      this.dialogVisible = true
      this.dialogTitle = '修改项目信息'
      this.$nextTick(() => { this.$refs.projectForm.clearValidate() })
    },
    async handleDelete(id) {
      await this.$confirm('您确定要删除该项目及其所有相关数据吗？').then(async() => {
        const res = await deleteProject(id)
        if (res && res.code === 0) {
          this.$message({ message: res.data, type: 'success' })
        } else {
          this.$message({ message: '删除项目失败！', type: 'error' })
        }
        this.fetchData()
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    },
    handleSort(data) {
      // 回到第一页
      this.page.currentPage = 1
      this.$set(this.sort, 'prop', data.prop)
      this.$set(this.sort, 'order', data.order)
      this.fetchData()
    },
    showTagInput() {
      this.tagInputVisible = true
      this.tagInputValue = ''
    },
    async getTagList(query) {
      this.loading = true
      this.tagOption = []
      this.tagList.forEach(tag => {
        const match = tag.match(query.trim())
        if (match && match.index === 0) this.tagOption.push(tag)
      })
      this.loading = false
    },
    handleInputConfirm() {
      const tag = this.tagInputValue.trim()
      if (tag !== '') {
        if (this.projectForm.tag.find(i => i === tag) === undefined) {
          this.projectForm.tag.push(tag)
        } else {
          this.$message('这个标签已存在')
        }
      }
      this.tagInputValue = ''
      this.tagInputVisible = false
    },
    handleDeleteTag(tag) {
      this.projectForm.tag.find((i, index) => {
        if (i === tag) {
          this.projectForm.tag.splice(index, 1)
        }
      })
    },
    async getPersonList(query) {
      this.loading = true
      this.personOption = []
      const users = await getUserData(query.trim())
      if (users && users.code === 0) {
        users.data.forEach(i => {
          this.personOption.push({ value: i._id, label: `${i.username}(${i.mail})` })
        })
      } else {
        this.$message({ message: '似乎出了一点问题...', type: 'error' })
      }
      this.loading = false
    },
    async handleSubmit() {
      // 表单校验
      this.$refs.projectForm.validate(async(valid) => {
        if (valid) {
          // 新建项目
          if (this.dialogTitle === '新建项目') {
            const data = await createProject(this.projectForm.name, this.projectForm.desc, this.projectForm.tag, this.projectForm.leader)
            if (data && data.code === 0) {
              this.$message({ message: data.data, type: 'success' })
            } else {
              this.$message({ message: '新建项目失败！', type: 'error' })
            }
          } else if (this.dialogTitle === '修改项目信息') {
            // 修改项目
            const formData = {}
            Object.keys(this.projectForm).forEach(i => {
              if (i !== 'leader' && i !== 'leaderid') this.$set(formData, i, this.projectForm[i])
            })
            if (this.projectForm.leader.indexOf('@') === -1) {
              this.$set(formData, 'leader', this.projectForm.leader)
            } else {
              this.$set(formData, 'leader', this.projectForm.leaderid)
            }
            const data = await updateProject(formData)
            if (data && data.code === 0) {
              this.$message({ message: data.data, type: 'success' })
            } else {
              this.$message({ message: '修改项目失败！', type: 'error' })
            }
          }
          // 重新调用接口，刷新数据
          this.fetchData()
          this.dialogVisible = false
        }
      })
    },

    async handleShowTypeDia() {
      this.loading = true
      const { data } = await getIssueType()
      data.forEach(i => { i.edit = false })
      this.issueType = JSON.parse(JSON.stringify(data))
      this.loading = false
      this.typeDiaVisible = true
    },
    handleCreateType() {
      this.issueType.push({ name: '', desc: '', edit: true })
    },
    handleEditType(index) {
      this.issueType[index].edit = true
    },
    async handleSubmitType(data) {
      const res = await updateIssueType(data.row)
      if (res && res.code === 0) {
        this.$message({ message: '保存成功！', type: 'success' })
      } else {
        this.$message({ message: '保存失败！', type: 'error' })
      }
      this.issueType[data.$index].edit = false
    },
    async handleDeleteType(data) {
      await this.$confirm('您确定要删除该任务类型吗？').then(async() => {
        if (data.row._id) {
          const res = await deleteIssueType(data.row._id)
          if (res && res.code === 0) {
            this.$message({ message: '删除成功！', type: 'success' })
            this.issueType.splice(data.$index, 1)
          } else {
            this.$message({ message: '删除失败！', type: 'error' })
          }
        } else {
          this.issueType.splice(data.$index, 1)
        }
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    },
    clickProject(id) {
      this.$router.push({ path: '/project/detail', query: { id }})
    }
  }
}
</script>

<style lang="scss" scoped>
.tags {
  margin: 0 5px
}

.tag-input {
  width: 90px
}
</style>
