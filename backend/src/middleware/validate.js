export const validate = (schema) => async (req, res, next) => {
    try {
        const parsed = await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });

        // reassign to parsed so subsequent handlers have validated, structured data
        req.body = parsed.body;
        req.query = parsed.query;
        req.params = parsed.params;

        return next();
    } catch (error) {
        // Send a 400 Bad Request if validation fails
        return res.status(400).json({
            success: false,
            data: null,
            error: error.errors || 'Validation error',
        });
    }
};
