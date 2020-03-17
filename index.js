const { ApolloServer } = require('apollo-server-express')
const expressPlayground = require('graphql-playground-middleware-express').default
const express = require('express')
const path = require('path')
const cors = require('cors')
const session = require('express-session')
const { readFileSync } = require('fs')
const { createServer } = require('http')
const { MongoClient } = require('mongodb')
const MongoDBStore = require('connect-mongodb-session')(session)
require('dotenv').config()

const typeDefs = readFileSync('./typeDefs.graphql', 'UTF-8')
const resolvers = require('./resolvers')

async function start() {
	const app = express()

	var store = new MongoDBStore({
		uri: process.env.MONGO_SESSION_STORAGE,
		collection: 'mySessions'
	})

	store.on('error', function(error) {
		console.log(error)
	})

	const sess = {
		secret: process.env.SESSION_SECRET,
		resave: false,
		cookie: {
			maxAge: 1000 * 60 * 60 * 24 * 7,
			sameSite: 'none'
		},
		store: store,
		saveUninitialized: false
	}
	sess.cookie.secure = true
	app.use(session(sess))

	const MONGO_DB = process.env.DB_HOST
	const client = await MongoClient.connect(MONGO_DB, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	const db = client.db()

	const context = async ({ req }) => {
		let users = db.collection('users')
		let studentData = db.collection('studentData')
		let lessonData = db.collection('lessonData')
		let assignmentData = db.collection('assignmentData')
		let unitData = db.collection('unitData')
		let classPeriodData = db.collection('classPeriodData')
		let generalInfo = db.collection('generalInfo')

		return {
			users,
			studentData,
			lessonData,
			assignmentData,
			classPeriodData,
			unitData,
			generalInfo,
			db,
			req
		}
	}

	const server = new ApolloServer({
		typeDefs,
		resolvers,
		context,
		introspection: true,
		playground: true,
		engine: {
			apiKey: process.env.ENGINE_API_KEY
		}
	})

	server.applyMiddleware({
		app,
		cors: {
			credentials: true,
			origin: [
				'http://localhost:3000',
				'https://mrwetherall.org',
				'https://mrwetherall-website.herokuapp.com'
			]
		}
	})

	app.get('/', (req, res) => res.end(`Teacher's Aide API`))
	app.get('/playground', expressPlayground({ endpoint: '/graphql' }))

	const httpServer = createServer(app)
	server.installSubscriptionHandlers(httpServer)

	httpServer.listen({ port: process.env.PORT || 4000 }),
		() => {
			console.log(`🚀 Server ready at ${port}`)
		}
}
start()
