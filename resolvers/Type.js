const { GraphQLScalarType } = require('graphql')
const GraphQLJSON = require('graphql-type-json')

module.exports = {
  Date: new GraphQLScalarType({
    name: 'Date',
    description: 'A valid date value',
    serialize: value => value.substring(0, 10),
    parseValue: value => new Date(value).toISOString().substring(0, 10),
    parseLiteral: literal =>
      new Date(literal.value).toISOString().substring(0, 10)
  }),
  JSON: GraphQLJSON,
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
