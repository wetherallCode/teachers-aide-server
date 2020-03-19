module.exports = {
	newSocraticQuestion: {
		subscribe: (_, __, { pubsub }) => pubsub.asyncIterator('socraticQuestion-added')
	}
}
// newPhoto : { subscribe : ( parent , args , { pubsub }) => pubsub . asyncIterator ( 'photo-added' ) }
