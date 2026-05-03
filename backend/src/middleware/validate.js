export const validate = (schema) => async (req, res, next) => {
    try {
        const parsed = await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });

        req.body = parsed.body;
        
        // Express 5.x makes req.query a getter, so we cannot reassign it directly.
        // We mutate the existing object instead.
        if (req.query) {
            Object.keys(req.query).forEach(k => delete req.query[k]);
            Object.assign(req.query, parsed.query);
        }

        // We can safely reassign params though usually mutating is safer
        req.params = parsed.params;

        return next();
    } catch (error) {
        // If it's a ZodError, it has .errors array
        if (error.errors) {
            return res.status(400).json({
                success: false,
                data: null,
                error: error.errors[0]?.message || 'Validation error',
                errorCode: 'VALIDATION_ERROR',
            });
        }
        
        // If it's a TypeError or something else
        console.error('[VALIDATE] Unexpected error in validate middleware:', error);
        return res.status(500).json({
            success: false,
            data: null,
            error: 'Internal server error during validation',
            errorCode: 'INTERNAL_ERROR',
        });
    }
};
