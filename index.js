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

	app.use(
		session({
			secret: process.env.SESSION_SECRET,
			resave: false,
			cookie: {
				maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
			},
			store: store,
			saveUninitialized: false
		})
	)

	const MONGO_DB = process.env.DB_HOST
	const client = await MongoClient.connect(MONGO_DB, { useNewUrlParser: true })
	const db = client.db()

	const context = async ({ req }) => {
		let users = db.collection('users')
		let studentData = db.collection('studentData')
		let lessonData = db.collection('lessonData')
		let classPeriodData = db.collection('classPeriodData')

		return { users, studentData, lessonData, classPeriodData, db, req }
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
				'https://mrwetherall-hooks-client.herokuapp.com',
				'http://localhost:3000',
				'https://mrwetherall.org',
				'http://www.mrwetherall.org'
			]
		}
	})

	app.get('/', (req, res) => res.end(`Teacher's Aide API`))
	app.get('/playground', expressPlayground({ endpoint: '/graphql' }))

	const httpServer = createServer(app)
	server.installSubscriptionHandlers(httpServer)

	httpServer.listen({ port: 4000 }),
		() => {
			console.log(`🚀 Server ready at ${port}`)
		}
}
start()
