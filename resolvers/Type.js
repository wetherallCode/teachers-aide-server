const { GraphQLScalarType } = require('graphql')

module.exports = {
	Date: new GraphQLScalarType({
		name: 'Date',
		description: 'A valid date value',
		serialize: value => value.substring(0, 10),
		parseValue: value => new Date(value).toISOString().substring(0, 10),
		parseLiteral: literal => new Date(literal.value).toISOString().substring(0, 10)
	}),

	Protocol: {
		__resolveType: parent => {
			if (parent.socraticQuestion) {
				return 'SocraticQuestionProtocol'
			}
		}
	},
	ClassProtocols: {
		__resolveType: parent => {
			if (parent.socraticQuestion) {
				return 'SocraticQuestionProtocolForClassPeriod'
			}
		}
	}
}
