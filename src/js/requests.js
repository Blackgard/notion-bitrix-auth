const { Client } = require("@notionhq/client")

const NOTION_KEY = process.env.NOTION_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

const notion = new Client({
    auth: NOTION_KEY,
});

const getListSitesByUrl = async (site_url, id = NOTION_DATABASE_ID) => {
    try 
    {
        const response = await notion.databases.query({
            database_id: id,
            filter: {
                property: "LINK",
                rich_text: {
                    contains: site_url
                }
            },
        });
        return response.results;
    }
    catch (error)
    {
        console.log(error);
    }

    return [];
}

const getAuthData = async (site_url, resolve, reject, id = NOTION_DATABASE_ID) => {
    if (!site_url)
    {
        reject(['Not get site url']);
        return;
    }

    const sitesList = await getListSitesByUrl(site_url, id);
    if (!sitesList && sitesList == [])
    {
        reject(['Not found site by url']);
        return;
    }

    const firstSite = sitesList[0];
    if (!firstSite)
    {
        reject(['Notion return none site data']);
        return;
    }

    const logPassData = firstSite.properties['Login | Admin'];
    if (!logPassData)
    {
        reject(['Notion not have column (\'Login | Admin\')']);
        return;
    }

    const logPasValue = logPassData['rich_text'][0]['plain_text'];
    if (!logPasValue)
    {
        reject(['Notion not set password and login']);
        return;
    }

    const login = logPasValue.split('\n')[0];
    const password = logPasValue.split('\n')[1];
    resolve(login, password);
    
    return;
}

export { getAuthData };