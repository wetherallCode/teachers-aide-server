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

	async updateResponsibilityPoints(_, { _id, responsibilityPoints }, { studentData }) {
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
		{
			input: { grade, assignedDate, assignedLesson, period }
		},
		{ classPeriodData, lessonData }
	) {
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
			period
		}

		const { insertedId } = await classPeriodData.insertOne(newClassPeriod)
		newClassPeriod._id = insertedId

		return newClassPeriod
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

	async removeClassPeriod(_, { _id }, { classPeriodData }) {
		const classPeriod = await classPeriodData.findOne({ _id: ObjectID(_id) })
		let removed = false

		if (classPeriod) {
			classPeriodData.deleteOne(classPeriod)
			removed = true
		}
		return { removed, classPeriod }
	},
	// assignedDate, period
	async markStudentAbsent(
		_,
		{ _id, date, assignedDate, period },
		{ studentData, classPeriodData }
	) {
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

		const addAbsentStudentToClassPeriod = await classPeriodData.updateOne(
			{ assignedDate, period },
			{
				$push: {
					absentStudents: updatedStudent
				}
			}
		)
		return updatedStudent
	},
	async unduMarkStudentAbsent(
		_,
		{ _id, date, assignedDate, period },
		{ studentData, classPeriodData }
	) {
		const updateStudent = await studentData.updateOne(
			{ _id: ObjectID(_id) },
			{
				$pull: { daysAbsent: { $in: [date] } }
			}
		)
		const updatedStudent = await studentData.findOne({ _id: ObjectID(_id) })

		const removeAbsentStudentFromClassPeriod = await classPeriodData.updateOne(
			{ assignedDate, period },
			{
				$pull: {
					absentStudents: { $in: [updatedStudent] }
				}
			}
		)
		const updatedClass = await classPeriodData.findOne({ assignedDate, period })
		console.log(updatedClass.absentStudents)
		return updatedStudent
	}
}

// async markStudentAbsent(_, { _id, date }, { studentData }) {
// 	const updateStudent = await studentData.updateOne(
// 		{ _id: ObjectID(_id) },
// 		{
// 			$push: {
// 				daysAbsent: date
// 			}
// 		}
// 	)
// 	const updatedStudent = await studentData.findOne({ _id: ObjectID(_id) })
// 	console.log(updatedStudent)
// 	return updatedStudent
// }
