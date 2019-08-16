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

	async createLesson(_, args, { lessonData }) {
		let newLesson = {
			...args.input
		}
		const { insertedId } = await lessonData.insertOne(newLesson)
		newLesson._id = insertedId

		return newLesson
	},

	async createClassPeriod(_, { ...args }, { classPeriodData }) {
		console.log(...args)
		let newClassPeriod = {
			...args.input
		}
		const { insertedId } = await classPeriodData.insertOne(newClassPeriod)
		newClassPeriod._id = insertedId
		console.log(newClassPeriod)
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
	}
}
