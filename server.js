const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Servir les fichiers statiques (notre page HTML)
app.use(express.static('public'));

// La route principale du proxy
app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).send('<h1>Erreur : URL manquante</h1><p>Veuillez fournir une URL. Exemple : /proxy?url=https://exemple.com</p>');
    }

    try {
        // Utiliser Axios pour faire la requête à la place du client
        const response = await axios.get(targetUrl, {
            // Important : on retire les en-têtes qui pourraient causer des problèmes
            // On essaie de se faire passer pour un navigateur classique
            headers: {
                'User-Agent': req.headers['user-agent'],
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3',
                'Referer': targetUrl // Le referer est souvent important
            },
            // Le proxy doit être capable de gérer les redirections
            maxRedirects: 5,
            // On récupère la réponse comme un flux de données brutes
            responseType: 'arraybuffer' 
        });

        // Récupérer les en-têtes de la réponse originale (type de contenu, etc.)
        const contentType = response.headers['content-type'];
        
        // Envoyer la réponse au client avec les bons en-têtes et le contenu
        res.set('Content-Type', contentType);
        res.send(response.data);

    } catch (error) {
        console.error("Erreur du proxy :", error.message);
        res.status(500).send(`<h1>Erreur lors de l'accès à ${targetUrl}</h1><p>${error.message}</p>`);
    }
});

app.listen(PORT, () => {
    console.log(`Serveur proxy démarré sur http://localhost:${PORT}`);
});