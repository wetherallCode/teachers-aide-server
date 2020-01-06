const bcrypt = require('bcrypt')
const { ObjectID } = require('mongodb')

module.exports = {
	async createAccount(_, { name, password }, { users }) {
		let existingUser = await users.findOne({ name })
		if (!existingUser) {
			let hashedPassword = await bcrypt.hash(password, 10)
			let newUser = {
				name,
				password: hashedPassword
			}
			await users.insertOne(newUser)

			return newUser
		} else {
			throw new Error(`${name} already exists. Try again!!`)
		}
	},

	async login(parent, { name, password }, { req, users }) {
		// checks the name of the login against the database
		const user = await users.findOne({ name })
		// if username or password don't match the database the client will recieve an error
		if (!user) {
			throw new Error('Wrong User Name')
		}

		const valid = await bcrypt.compare(password, user.password)
		if (!valid) {
			throw new Error('Wrong Password')
		}
		// assigns user _id to the session.id
		user.id = user._id.toString()
		// starts the session
		req.session.userId = user.id
		console.log(req.session)
		return user
	},

	async logout(parent, args, { req }) {
		if (req.session) {
			// ends the session logging the user out
			req.session.destroy()
			return true
		}
	},

	async addStudent(parent, args, { studentData }) {
		let newStudent = {
			...args.input
		}
		const { insertedId } = await studentData.insertOne(newStudent)
		newStudent._id = insertedId

		return newStudent
	},

	async updateStudent(parent, { _id, ...args }, { studentData }) {
		const { firstName, lastName, responsibilityPoints, period, desk, teacher } = args

		const updateStudent = await studentData.updateOne(
			{ _id: ObjectID(_id) },
			{
				$set: {
					_id: ObjectID(_id),
					firstName: firstName,
					lastName: lastName,
					responsibilityPoints: responsibilityPoints,
					period: period,
					desk: desk,
					teacher: teacher
				}
			}
		)

		const updatedStudent = await studentData.findOne({ _id: ObjectID(_id) })

		return updatedStudent
	},

	async updateResponsibilityPoints(_, { input: { _id, responsibilityPoints } }, { studentData }) {
		const updateStudentsResponsibilityPoints = await studentData.updateOne(
			{ _id: ObjectID(_id) },
			{ $inc: { responsibilityPoints: responsibilityPoints } }
		)
		const student = await studentData.findOne({ _id: ObjectID(_id) })
		return student
	},

	async hideStudentFromRoster(parent, { _id, isHiddenFromRoster }, { studentData }) {
		const hideStudent = await studentData.updateOne(
			{ _id: ObjectID(_id) },
			{
				$set: {
					isHiddenFromRoster: isHiddenFromRoster
				}
			}
		)
		const hiddenStudent = await studentData.findOne({ _id: ObjectID(_id) })

		return hiddenStudent
	},

	async removeStudent(parent, { _id }, { studentData }) {
		const student = await studentData.findOne({ _id: ObjectID(_id) })

		let removed = false

		if (student) {
			studentData.deleteOne(student)
			removed = true
		}

		return { removed, student }
	},

	async createLesson(_, args, { lessonData, unitData }) {
		const unitName = await unitData.findOne({ name: args.input.inUnit })

		let newLesson = {
			...args.input,
			inUnit: unitName
		}

		const { insertedId } = await lessonData.insertOne(newLesson)
		newLesson._id = insertedId

		return newLesson
	},

	async editLesson(_, { _id, ...args }, { lessonData, unitData }) {
		const unitName = await unitData.findOne({ name: args.input.inUnit })
		const editLesson = await lessonData.updateOne(
			{ _id: ObjectID(_id) },
			{
				$set: {
					lessonName: args.input.lessonName,
					inUnit: unitName,
					warmup: args.input.warmup,
					essentialQuestion: args.input.essentialQuestion,
					socraticQuestions: args.input.socraticQuestions,
					studyGuideQuestions: args.input.studyGuideQuestions,
					vocabWords: args.input.vocabWords,
					readings: args.input.readings,
					workDue: args.input.workDue
				}
			}
		)
		const editedLesson = await lessonData.findOne({ _id: ObjectID(_id) })

		return editedLesson
	},

	async createUnit(_, args, { unitData }) {
		console.log(args)
		let newUnit = {
			...args.input
		}
		const { insertedId } = await unitData.insertOne(newUnit)
		newUnit._id = insertedId

		return newUnit
	},

	async createClassPeriod(
		_,
		{ input: { grade, assignedDate, assignedLesson, period, assignedHomework } },
		{ classPeriodData, lessonData, assignmentData, studentData }
	) {
		const studentsInClass = await studentData.find({ period: period }).toArray()

		const classPeriodCheck = await classPeriodData.findOne({
			assignedDate: assignedDate,
			period: period
		})
		if (classPeriodCheck) {
			throw new Error('ClassPeriod already Created')
		}

		const lessonName = await lessonData.findOne({ lessonName: assignedLesson })

		let newClassPeriod = {
			assignedDate,
			grade,
			assignedLesson: lessonName,
			period,
			assignedHomework
		}

		const { insertedId } = await classPeriodData.insertOne(newClassPeriod)
		newClassPeriod._id = insertedId

		assignedHomework.forEach(assignment => {
			studentData.updateMany(
				{ period: period },
				{
					$push: {
						hasAssignments: {
							assignmentType: assignment.assignmentType,
							assignedDate: assignment.assignedDate,
							dueDate: assignment.dueDate,
							readingPages: assignment.readingPages,
							readingSections: assignment.readingSections,
							missing: true,
							exempt: false,
							score: 0
						}
					}
				}
			)
		})
		studentData.updateMany({ period: period }, { $inc: { responsibilityPoints: -2 } })

		return newClassPeriod
	},

	async scoreAssignment(
		_,
		{
			input: { _id, date, responsibilityPoints, missing, exempt, assignmentType, score, comments }
		},

		{ studentData }
	) {
		const scoredAssignment = await studentData.updateOne(
			{
				_id: ObjectID(_id),
				hasAssignments: { $elemMatch: { dueDate: date, assignmentType: assignmentType } }
			},

			{
				$set: {
					'hasAssignments.$.score': score,
					'hasAssignments.$.missing': missing,
					'hasAssignments.$.exempt': exempt,
					'hasAssignments.$.comments': comments
				},
				$inc: { responsibilityPoints: responsibilityPoints }
			}
		)
		let scored = true
		let currentScore = score
		let lastScore = score
		const student = studentData.findOne({ _id: ObjectID(_id) })

		return { scored, student, lastScore, currentScore }
	},

	async undoScoreAssignment(
		_,
		{ input: { _id, date, assignmentType, score } },

		{ studentData }
	) {
		const undoScoredAssignment = await studentData.updateOne(
			{
				_id: ObjectID(_id),
				hasAssignments: { $elemMatch: { dueDate: date, assignmentType: assignmentType } }
			},

			{
				$set: {
					'hasAssignments.$.score': 0,
					'hasAssignments.$.missing': true,
					'hasAssignments.$.exempt': false,
					'hasAssignments.$.comments': []
				},
				$inc: { responsibilityPoints: -score }
			}
		)
		let assignmentScoreReset = true
		const student = studentData.findOne({ _id: ObjectID(_id) })

		return { assignmentScoreReset, student }
	},

	async removeLesson(_, { _id }, { lessonData }) {
		const lesson = await lessonData.findOne({ _id: ObjectID(_id) })

		let removed = false

		if (lesson) {
			lessonData.deleteOne(lesson)
			removed = true
		}
		return { removed, lesson }
	},

	async removeUnit(_, { grade, name }, { unitData }) {
		const unit = await unitData.findOne({ grade: grade, name: name })
		let removed = false

		if (unit) {
			unitData.deleteOne(unit)
			removed = true
		}
		return { removed, unit }
	},

	async removeClassPeriod(
		_,
		{ input: { _id, date, period, withAssignments } },
		{ classPeriodData, studentData }
	) {
		const classPeriod = await classPeriodData.findOne({ _id: ObjectID(_id) })
		let removed = false

		if (classPeriod) {
			classPeriodData.deleteOne(classPeriod)
			removed = true
		}

		if (withAssignments) {
			studentData.updateMany(
				{
					period: period
				},
				{
					$pull: {
						hasAssignments: { assignedDate: date }
					},
					$inc: { responsibilityPoints: 2 }
				}
			)
		}

		return { removed, classPeriod }
	},

	async addLearningStyle(_, { _id, learningStyle }, { studentData }) {
		const updateStudentLearningStyle = await studentData.updateOne(
			{ _id: ObjectID(_id) },
			{
				$set: {
					learningStyle: learningStyle
				}
			}
		)
		const updatedStudent = await studentData.findOne({ _id: ObjectID(_id) })

		return updatedStudent
	},

	async markStudentAbsent(_, { _id, date }, { studentData, classPeriodData }) {
		const findStudentAbsences = await studentData.findOne({ _id: ObjectID(_id) })

		if (findStudentAbsences.daysAbsent !== undefined) {
			var checkForDuplicateAbsences = findStudentAbsences.daysAbsent.find(
				element => element === date
			)
		}

		if (checkForDuplicateAbsences) {
			throw new Error('This student has already been marked absent')
		}

		const updateStudent = await studentData.updateOne(
			{ _id: ObjectID(_id) },
			{
				$push: {
					daysAbsent: date
				}
			}
		)
		const updatedStudent = await studentData.findOne({ _id: ObjectID(_id) })
		return updatedStudent
	},

	async markStudentLate(_, { _id, date }, { studentData }) {
		const findStudentLatenesses = await studentData.findOne({ _id: ObjectID(_id) })

		if (
			findStudentLatenesses.daysLate !== undefined &&
			findStudentLatenesses.daysLate.find(day => day === date)
		) {
			throw new Error('This student has already been marked absent')
		}

		const updateStudent = await studentData.updateOne(
			{ _id: ObjectID(_id) },
			{
				$push: {
					daysLate: date
				},
				$inc: { responsibilityPoints: -10 }
			}
		)

		const updatedStudent = await studentData.findOne({ _id: ObjectID(_id) })
		return updatedStudent
	},

	async unduMarkStudentAbsent(_, { _id, date }, { studentData }) {
		const updateStudent = await studentData.updateOne(
			{ _id: ObjectID(_id) },
			{
				$pull: { daysAbsent: { $in: [date] } }
			}
		)
		const updatedStudent = await studentData.findOne({ _id: ObjectID(_id) })
		return updatedStudent
	},

	async unduMarkStudentLate(_, { _id, date }, { studentData }) {
		const updateStudent = await studentData.updateOne(
			{ _id: ObjectID(_id) },
			{
				$pull: { daysLate: { $in: [date] } },
				$inc: { responsibilityPoints: 10 }
			}
		)
		const updatedStudent = await studentData.findOne({ _id: ObjectID(_id) })
		return updatedStudent
	}
}
