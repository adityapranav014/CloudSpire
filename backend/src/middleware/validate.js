export const validate = (schema) => async (req, res, next) => {
    try {
        const parsed = await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });

        req.body = parsed.body;
        req.query = parsed.query;
        req.params = parsed.params;

        return next();
    } catch (error) {
        return res.status(400).json({
            success: false,
            data: null,
            error: error.errors?.[0]?.message || 'Validation error',
            errorCode: 'VALIDATION_ERROR',
        });
    }
};
