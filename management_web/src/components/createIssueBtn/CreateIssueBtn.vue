<template>
  <div>
    <el-button icon="el-icon-plus" @click="handleClick">创建任务</el-button>

    <el-dialog title="创建任务" :visible.sync="dialogVisible" width="60%">
      <el-form :model="editData" :rules="rules" label-position="left" label-width="80px" ref="dialogForm" style="padding: 0 20px">
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="editData.name" placeholder="请输入名称"/>
        </el-form-item>
        <el-form-item label="任务类型" prop="type">
          <el-select v-model="editData.type" placeholder="请选择">
            <el-option v-for="i in issueType" :key="i._id" :value="i._id" :label="i.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-radio-group v-model="editData.priority" size="small">
            <el-radio-button :label="1" />
            <el-radio-button :label="2" />
            <el-radio-button :label="3" />
            <el-radio-button :label="4" />
          </el-radio-group>
          <el-popover placement="top-start" width="200" trigger="hover" content="优先级数字越小，则代表任务越重要。">
            <i class="el-icon-question" style="margin-left: 10px;" slot="reference"/>
          </el-popover>
        </el-form-item>
        <el-form-item label="问题描述">
          <editor @change="handleEditorChange" :content="editData.desc" />
        </el-form-item>
        <el-form-item label="指派给">
          <el-select v-model="editData.assignee" filterable>
            <el-option v-for="item in personOption" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="预计耗时" prop="estimate">
          <el-input v-model="editData.estimate" style="width: 220px;"/>
          <span style="padding: 0 10px">eg. 3w 4d 6h</span>
          <el-popover placement="top-start" width="300" trigger="hover">
            <div>时间单位： 周(w)，天(d)，小时(h)</div>
            <div style="margin-top: 10px;">转换标准： 1w = 5d, 1d = 8h</div>
            <i class="el-icon-question" slot="reference"/>
          </el-popover>
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { formatLogtoHour } from '@/utils/index.js'
import { getTeamInfo } from '@/network/project.js'
import { getIssueType } from '@/network/issueType.js'
import { createIssue } from '@/network/issue.js'
import { logHistory } from '@/network/history.js'

import Editor from '@/components/wangEditor/index.vue'

export default {
  components: {
    Editor
  },
  props: {
    sprint: {
      type: String,
      default: ''
    },
    project: {
      type: String,
      default: ''
    }
  },
  data() {
    const validateEstimate = (rule, value, callback) => {
      // 只能输入数字和hdw、空格
      const reg = /^[(h|d|w)0-9\s]+$/
      const reg2 = /\d+(h|w|d)\d+(h|w|d)\d+(h|w|d)|\d+(h|w|d)\d+(h|w|d)|\d+(h|w|d)/
      if (value.trim() === '') {
        callback()
      } else if (!reg.test(value) || !reg2.test(value)) {
        callback(new Error('请输入正确的格式'))
      } else {
        callback()
      }
    }
    return {
      dialogVisible: false,
      loading: false,
      editData: { name: '', type: '', priority: 3, desc: '', assignee: '', estimate: '' },
      issueType: [],
      personOption: [],
      rules: {
        name: { required: true, message: '请输入任务名称', trigger: 'blur' },
        type: { required: true, message: '请选择任务类型', trigger: ['blur', 'change'] },
        estimate: { validator: validateEstimate, trigger: 'blur' }
      }
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      const types = await getIssueType()
      this.issueType = types.data
      const teamData = await getTeamInfo(this.project)
      if (teamData && teamData.data && teamData.data.team) {
        teamData.data.team.forEach(i => {
          this.personOption.push({ value: i._id, label: `${i.username}(${i.mail})` })
        })
      }
    },

    handleClick() {
      this.dialogVisible = true
      this.$bus.$emit('clear-editor')
      Object.keys(this.editData).forEach(k => {
        if (k === 'priority') {
          this.editData[k] = 3
        } else {
          this.editData[k] = ''
        }
      })
    },
    handleEditorChange(content) {
      this.editData.desc = content
    },
    async handleSubmit() {
      this.$refs.dialogForm.validate(async(valid) => {
        if (valid) {
          this.loading = true
          const submitData = {}
          Object.keys(this.editData).forEach(k => {
            if (this.editData[k] !== '' && this.editData[k] !== undefined && this.editData[k] !== null) {
              this.$set(submitData, k, this.editData[k])
            }
          })
          if (submitData.estimate) {
            submitData.estimate = formatLogtoHour(submitData.estimate, 8)
            submitData.logtime = submitData.estimate
          }
          this.$set(submitData, 'assigner', this.$store.state.user_info._id)
          this.$set(submitData, 'project', this.project)
          this.$set(submitData, 'sprint', this.sprint === '' ? null : this.sprint)
          const res = await createIssue(submitData)
          if (res && res.code === 0) {
            await logHistory(this.project, res.data._id, this.$store.state.user_info._id, 'create', null)
            if (submitData.estimate) {
              await logHistory(this.project, res.data._id, this.$store.state.user_info._id, 'estimate', submitData.estimate)
            }
            this.$emit('success')
            this.$message({ message: '新建任务成功', type: 'success' })
          } else {
            this.$message({ message: '新建任务失败！', type: 'error' })
          }
          this.dialogVisible = false
          this.loading = false
        }
      })
    }
  }
}
</script>
