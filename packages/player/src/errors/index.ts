export class AlreadyAtDestinationError{
    readonly _tag = 'AlreadyAtDestinationError'
}

export class ArtifactError extends Error {
    readonly _tag = 'ArtifactError'
}
