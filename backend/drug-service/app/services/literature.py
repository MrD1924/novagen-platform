"""PubMed literature search via NCBI's E-utilities.

This calls the real, public NCBI Entrez API — every result returned is an
actual PubMed record with its real PMID, title, and journal, fetched live.
Nothing here is generated or paraphrased by a model; if NCBI has no matching
records, this returns an empty list rather than inventing citations.

API reference: https://www.ncbi.nlm.nih.gov/books/NBK25501/
Rate limits: 3 req/sec without an API key, 10 req/sec with one (set
NCBI_API_KEY in .env — see shared/config.py). Unauthenticated use is fine for
moderate traffic; add a key before scaling this in production.
"""
import httpx

ESEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
ESUMMARY_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"


async def search_pubmed(query: str, max_results: int = 10, api_key: str | None = None) -> list[dict]:
    """Two-step E-utilities flow: esearch for matching PMIDs, then esummary
    for their metadata. Returns [] on no matches; raises on a genuine
    upstream/network failure rather than silently returning fabricated data."""
    params_common = {"db": "pubmed", "retmode": "json"}
    if api_key:
        params_common["api_key"] = api_key

    async with httpx.AsyncClient(timeout=15.0) as client:
        search_resp = await client.get(
            ESEARCH_URL,
            params={**params_common, "term": query, "retmax": max_results, "sort": "relevance"},
        )
        search_resp.raise_for_status()
        id_list = search_resp.json().get("esearchresult", {}).get("idlist", [])

        if not id_list:
            return []

        summary_resp = await client.get(
            ESUMMARY_URL,
            params={**params_common, "id": ",".join(id_list)},
        )
        summary_resp.raise_for_status()
        result = summary_resp.json().get("result", {})

    articles = []
    for pmid in id_list:
        record = result.get(pmid)
        if not record:
            continue
        authors = [a.get("name", "") for a in record.get("authors", [])][:3]
        articles.append(
            {
                "pmid": pmid,
                "title": record.get("title", "").rstrip("."),
                "journal": record.get("fulljournalname") or record.get("source", ""),
                "pub_date": record.get("pubdate", ""),
                "authors": authors,
                "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
            }
        )
    return articles
