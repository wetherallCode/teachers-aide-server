const { GraphQLScalarType } = require('graphql')

module.exports = {
	Date: new GraphQLScalarType({
		name: 'Date',
		description: 'A valid date value',
		serialize: value => value.substring(0, 10),
		parseValue: value => new Date(value).toISOString(),
		parseLiteral: literal => new Date(literal.value).toISOString()
	})
}
