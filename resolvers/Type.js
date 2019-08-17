const { GraphQLScalarType } = require('graphql')

module.exports = {
	Date: new GraphQLScalarType({
		name: 'Date',
		description: 'A valid date value',
		serialize: value => value.substring(0, 10),
		parseValue: value => value.toISOString().substring(0, 10),
		parseLiteral: literal => value.toISOString().substring(0, 10)
	})
}
