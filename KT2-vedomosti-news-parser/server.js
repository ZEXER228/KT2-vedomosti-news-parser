const express = require('express');
const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', './views');

const categoryMap = {
  business: {
    rss: 'business',
    title: 'Бизнес'
  },
  economic: {
    rss: 'economics',
    title: 'Экономика'
  },
  finances: {
    rss: 'finance',
    title: 'Финансы'
  },
  politics: {
    rss: 'politics',
    title: 'Политика'
  }
};

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/categories', async (req, res) => {
  try {
    const response = await fetch('https://www.vedomosti.ru/info/rss');
    const html = await response.text();
    const regex = /<strong>([^<]+)<\/strong>(?:<br>|\s*)*<a[^>]*href="https:\/\/www\.vedomosti\.ru\/rss\/rubric\/([^"]+?)(?:\.xml)?"/gi;
    let match;
    const list = [];
    const aliasMap = {
      business: 'business',
      economics: 'economic',
      finance: 'finances',
      politics: 'politics'
    };

    while ((match = regex.exec(html)) !== null) {
      const slug = match[2].replace(/\.xml$/, '');
      const key = aliasMap[slug];

      if (key && categoryMap[key]) {
        list.push({
          title: categoryMap[key].title,
          category: key
        });
      }
    }

    if (list.length === 0) {
      return res.json([
        { title: 'Бизнес', category: 'business' },
        { title: 'Экономика', category: 'economic' },
        { title: 'Финансы', category: 'finances' },
        { title: 'Политика', category: 'politics' }
      ]);
    }

    res.json(list);
  } catch (error) {
    res.json([
      { title: 'Бизнес', category: 'business' },
      { title: 'Экономика', category: 'economic' },
      { title: 'Финансы', category: 'finances' },
      { title: 'Политика', category: 'politics' }
    ]);
  }
});

app.get('/:count/news/for/:category', async (req, res) => {
  const count = parseInt(req.params.count);
  const category = req.params.category.toLowerCase();

  if (isNaN(count) || count <= 0) {
    return res.status(400).send('Число должно быть целым положительным');
  }

  const selectedCategory = categoryMap[category];

  if (!selectedCategory) {
    return res.status(404).send('Категория не найдена. Доступны: business, economic, finances, politics');
  }

  const rssUrl = `https://www.vedomosti.ru/rss/rubric/${selectedCategory.rss}`;
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.status !== 'ok' || !data.items) {
      return res.status(500).send('Не удалось получить новости');
    }

    const items = data.items.slice(0, count);

    res.render('news', {
      count,
      categoryTitle: selectedCategory.title,
      items
    });
  } catch (error) {
    res.status(500).send('Внутренняя ошибка сервера');
  }
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
