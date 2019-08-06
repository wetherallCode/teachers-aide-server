const { ObjectID } = require('mongodb')

module.exports = {
	totalStudents: (_, __, { studentData }) => studentData.estimatedDocumentCount(),

	allStudents: (_, __, { studentData }) => studentData.find().toArray(),

	totalUsers: (_, __, { users }) => users.estimatedDocumentCount(),

	allUsers: (_, __, { users }) => users.find().toArray(),

	me: (_, __, { req, users }) => {
		console.log(req.session.userId)
		if (!req.session.userId) {
			console.log('user is null')
			return null
		}

		return users.findOne({ _id: ObjectID(req.session.userId) })
	},

	async classRoster(_, { period }, { studentData }) {
		const students = await studentData.find({ period: period }).toArray()
		return students
	},

	async numberOfStudentsInCourse(_, { period }, { studentData }) {
		const studentsInCourse = await studentData.countDocuments({ period: period })

		return studentsInCourse
	},

	async student(_, { _id }, { studentData }) {
		const student = await studentData.findOne({ _id: ObjectID(_id) })
		return student
	},

	async lesson(_, { _id }, { lessonData }) {
		const lesson = await lessonData.findOne({ _id: ObjectID(_id) })
		return lesson
	},

	async findStudentByPeriodAndDesk(_, { period, desk }, { studentData }) {
		const student = await studentData.findOne({ period: period, desk: desk })

		return student
	},

	async findLesson(_, { _id }, { lessonData }) {
		const lesson = await lessonData.findOne({ _id: ObjectID(_id) })
		return lesson
	},

	async findAllLessons(_, __, { lessonData }) {
		const lessons = await lessonData.find().toArray()
		return lessons
	}
}
