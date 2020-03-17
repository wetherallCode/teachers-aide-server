const { ObjectID } = require('mongodb')

module.exports = {
	totalStudents: (_, __, { studentData }) => studentData.estimatedDocumentCount(),

	allStudents: (_, __, { studentData }) => studentData.find().toArray(),

	findCurrentMarkingPeriod: (_, { _id }, { generalInfo }) => {
		const markingPeriod = generalInfo.findOne({ _id: ObjectID(_id) })

		return markingPeriod
	},

	totalUsers: (_, __, { users }) => users.estimatedDocumentCount(),

	allUsers: (_, __, { users }) => users.find().toArray(),

	async me(_, __, { req, users }) {
		if (!req.session.userId) {
			console.log('user is null')
			return null
		}
		const me = await users.findOne({ _id: ObjectID(req.session.userId) })
		return me
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

	async findLessonByName(_, { name }, { lessonData }) {
		const lesson = await lessonData.findOne({ lessonName: name })
		return lesson
	},
	async findLessonsByUnit(_, { inUnit }, { lessonData }) {
		const lesson = await lessonData.find({ 'inUnit.name': inUnit }).toArray()
		return lesson
	},

	async findAllLessons(_, __, { lessonData }) {
		const lessons = await lessonData.find().toArray()
		return lessons
	},

	async findClassPeriod(_, { assignedDate, period }, { classPeriodData }) {
		const classPeriod = await classPeriodData.findOne({ assignedDate, period })

		return classPeriod
	},

	async findClassPeriodByTestDueDate(_, { dueDate, period }, { classPeriodData }) {
		const classPeriod = await classPeriodData.findOne({ 'assignedTest.dueDate': dueDate, period })

		return classPeriod
	},

	async findClassPeriods(_, __, { classPeriodData }) {
		const classPeriods = await classPeriodData.find().toArray()

		return classPeriods
	},

	async findClassPeriodsForCourse(_, { period }, { classPeriodData }) {
		const classPeriods = await classPeriodData.find({ period }).toArray()
		return classPeriods
	},

	async findClassPeriodById(_, { _id }, { classPeriodData }) {
		const classPeriod = await classPeriodData.findOne({ _id: ObjectID(_id) })

		return classPeriod
	},

	async findUnit(_, { _id }, { unitData }) {
		const unit = await unitData.findOne({ _id: ObjectID(_id) })
		return unit
	},

	async findUnitsByGrade(_, { gradeLevel }, { unitData }) {
		const units = await unitData.find({ gradeLevel: gradeLevel }).toArray()
		return units
	},
	async findAssignmentByStudentAndDateAndType(
		_,
		{ input: { _id, date, assignmentType } },
		{ studentData }
	) {
		const student = await studentData.findOne({
			_id: ObjectID(_id),
			hasAssignments: { $elemMatch: { dueDate: date, assignmentType: assignmentType } }
		})

		return student
	}
}
