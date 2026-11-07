Website Name,Target Search Statement / Endpoint
Smart India Hackathon (sih.gov.in),"Search: ""Problem Statements"", Filter by: ""Hardware"" or ""Software""[cite: 1, 2]"
Open Government Data Platform (data.gov.in),"Search API/Catalog for: ""Mandi Commodity Prices"", ""Vehicle Non-Compliance"", ""Foreign Trade""[cite: 3, 4]"
MeitY Startup Hub (msh.meity.gov.in),"Search: ""What's New"", ""Grand Challenges"", ""Business Requirement Documents""[cite: 5, 6]"
iDEX Defence Innovation (idex.gov.in),"Search: ""DISC Problem Statements"", ""Defence India Start-up Challenge""[cite: 7, 8]"
OpenCity India (data.opencity.in),"Search: ""Urban Mobility"", ""Civic Infrastructure Deficits"", ""Groundwater Stress""[cite: 9]"


Act as an expert Backend & Web Scraping Engineer. I am building a website that aggregates startup ideas, problem statements, and market pain points from Indian government and open-data portals. I need you to build the backend scraping engine for the following 5 target websites:

Smart India Hackathon (sih.gov.in)

Target URL / Search: Official Problem Statements directory (sih.gov.in/sih2025PS or active PS catalog)

Search/Filter Strategy: Query for "Problem Statements" across "Hardware" and "Software" categories

Extract Fields: Problem_Statement_ID, Title, Organization/Ministry, Theme/Category, Detailed Description, Expected Deliverables

Open Government Data Platform India (data.gov.in)

Target Endpoints: OGD REST APIs using target resource UUIDs

Search/Filter Strategy: Pull datasets related to "Mandi Commodity Prices", "Vehicle Non-Compliance / Transport", and "Foreign Trade"

Extract Fields: API Record JSON attributes, resource_id, scraped_timestamp, raw data values

MeitY Startup Hub (msh.meity.gov.in)

Target URL / Search: "What's New" and "Programs / Grand Challenges" pages

Search/Filter Strategy: Search for "Grand Challenges", "Business Requirement Documents", and regulatory compliance RFPs

Extract Fields: Program Title, Submitting Agency, Challenge Summary, Deadline, PDF/BRD Document URLs

iDEX Defence Innovation (idex.gov.in)

Target URL / Search: DISC (Defence India Start-up Challenge) problem statement pages

Search/Filter Strategy: Search for "DISC Problem Statements" and active armed forces briefs

Extract Fields: Challenge Title, Armed Forces Category (Army/Navy/Air Force/DPSUs), Technical Problem Description, Linked PDF Challenge Brief URLs

OpenCity India (data.opencity.in)

Target URL / Search: Open City datasets registry

Search/Filter Strategy: Filter datasets by tags: "Mobility", "Civic Infrastructure Deficits", "Environment", and "Governance"

Extract Fields: Dataset Title, City/Location, Category Tag, Summary Description, Direct File Download Links (CSV/GeoJSON/KML)

Requirements for the Scraping Engine Code:

Build modular Python scraping functions (using BeautifulSoup, Scrapy, or API fetchers) for each of the 5 targets.

Standardize all scraped output into a unified JSON format with the following keys:
{
"source_name": "...",
"title": "...",
"category": "...",
"description": "...",
"source_url": "...",
"scraped_at": "..."
}

Include robust error handling, User-Agent rotation, rate-limiting, and offset pagination where required.