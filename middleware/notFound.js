'use strict';

module.exports = (req, res) => {
    res.status(404).render('errors/404', {
        title:   '404 | Maison Luxe',
        message: 'The page you\'re looking for doesn\'t exist.',
    });
};
