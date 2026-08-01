const SITE_NAME = '더열정 뮤지컬 예매 페이지';
const DEFAULT_DESCRIPTION = '더열정 뮤지컬 공연 정보를 확인하고 예매하세요.';

const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const plainText = (value) => String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);

const getPerformanceId = (event) => {
    const queryId = event.queryStringParameters?.id;
    const pathId = event.path?.match(/\/performance\/(\d+)\/?$/)?.[1];
    const id = queryId ?? pathId;
    return /^\d+$/.test(String(id ?? '')) ? String(id) : null;
};

const fetchIndexHtml = async (event) => {
    const host = event.headers['x-forwarded-host'] || event.headers.host;
    const protocol = event.headers['x-forwarded-proto'] || 'https';
    const response = await fetch(`${protocol}://${host}/index.html`);

    if (!response.ok) {
        throw new Error(`Unable to load index.html (${response.status})`);
    }

    return response.text();
};

const fetchPerformance = async (id) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase environment variables are not configured');
    }

    const endpoint = new URL('/rest/v1/performances', supabaseUrl);
    endpoint.searchParams.set('id', `eq.${id}`);
    endpoint.searchParams.set('select', 'id,title,description,poster_url,is_deleted,deleted_at');
    endpoint.searchParams.set('limit', '1');

    const response = await fetch(endpoint, {
        headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Unable to load performance (${response.status})`);
    }

    const [performance] = await response.json();
    if (!performance || performance.is_deleted === true || performance.deleted_at) return null;
    return performance;
};

const injectMetadata = (html, performance, canonicalUrl) => {
    if (!performance) return html;

    const title = `${plainText(performance.title)} | ${SITE_NAME}`;
    const description = plainText(performance.description) || DEFAULT_DESCRIPTION;
    const posterUrl = performance.poster_url
        ? `https://wsrv.nl/?url=${encodeURIComponent(performance.poster_url)}&output=jpg`
        : '';

    const imageMetadata = posterUrl ? `
  <meta property="og:image" content="${escapeHtml(posterUrl)}" />
  <meta property="og:image:secure_url" content="${escapeHtml(posterUrl)}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="${escapeHtml(posterUrl)}" />` : '';

    const metadata = `
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />${imageMetadata}
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />`;

    return html
        .replace(/<title>.*?<\/title>/is, `<title>${escapeHtml(title)}</title>`)
        .replace('</head>', `${metadata}\n</head>`);
};

export const handler = async (event) => {
    try {
        const id = getPerformanceId(event);
        const html = await fetchIndexHtml(event);

        if (!id) {
            return { statusCode: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8' }, body: html };
        }

        let performance;
        try {
            performance = await fetchPerformance(id);
        } catch (error) {
            // A metadata lookup must never prevent the client-side app from loading.
            console.error('[performance-meta] metadata lookup failed', error);
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'text/html; charset=UTF-8' },
                body: html,
            };
        }
        const host = event.headers['x-forwarded-host'] || event.headers.host;
        const protocol = event.headers['x-forwarded-proto'] || 'https';
        const canonicalUrl = `${protocol}://${host}/performance/${id}`;

        return {
            statusCode: performance ? 200 : 404,
            headers: {
                'Content-Type': 'text/html; charset=UTF-8',
                'Cache-Control': 'public, max-age=0, s-maxage=300',
            },
            body: injectMetadata(html, performance, canonicalUrl),
        };
    } catch (error) {
        console.error('[performance-meta]', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
            body: '공연 정보를 불러오지 못했습니다.',
        };
    }
};
