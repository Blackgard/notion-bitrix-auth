import '../css/style.css';

import 'dotenv/config';
require('dotenv').config();

import { getAuthData } from './requests';

const init = async () => {
    const auth = async () => {
        const { domain, cur_tab } = await getCurSiteUrlData();
        getAuthData(
            domain, 
            (l, p) => {
                printToLogs(`Login is ${domain} site`, 'S');
                setAuthDataInLoginBitrix(l, p, cur_tab.id);
            }, (errors) => {
                printToLogs(`Error login in ${domain} site: ${errors.join(', ')}`, 'E');
                constShowError(errors);
            });
    };

    const getCurSiteUrlData = () => {
        return new Promise((resolve, reject) => {
            try {
                chrome.tabs.query({active: true, currentWindow: true}, tabs => {
                    let url = new URL(tabs[0].url);

                    resolve({
                        url: url,
                        domain: url.hostname.replace('www.', '').split('.')[0],
                        domain_origin: url.hostname,
                        tabs: tabs,
                        cur_tab: tabs[0]
                    });
                })
            } catch (e) {
                reject(e)
            }
        });
    }

    const checkHaveAuthToNotion = async () => {
        const { domain } = await getCurSiteUrlData();
        getAuthData(
            domain,
            (l, p) => {
                printToLogs(`Login for ${domain} site is found`, 'S');
                setDataOnNAB('notion-auth-domain-found-in-na', '<span class="s"></span>', '<span class="e"></span>', 'html');
                setDataOnNAB('notion-auth-domain-login', l, '', 'text');
                setDataOnNAB('notion-auth-domain-password', p, '', 'val');

                document.getElementById('notion-auth-domain-login-wrapper').classList.add('show');
                document.getElementById('notion-auth-domain-password-wrapper').classList.add('show');

                setPasswordEvents();

                setCopyEventById('notion-auth-domain-login');
                setCopyEventById('notion-auth-domain-password', 'value');
            }, 
            (errors) => {
                printToLogs(`Error login in ${domain} site: ${errors.join(', ')}`, 'E');
                setDataOnNAB('notion-auth-domain-found-in-na', '<span class="e"></span>', '<span class="e"></span>', 'html');
            }
        );
    }

    const printToLogs = (message, status) => {
        const obLog = document.getElementById('notion-auth-logs-input');
        obLog.value += `${status} | ${message} \n`;
    }

    const redirectToAdminPage = async () => {
        const { url, cur_tab } = await getCurSiteUrlData();
        let link = `${url.origin}/bitrix/admin/`;

        chrome.scripting.executeScript({
            target: {
                tabId: cur_tab.id
            },
            args: [link],
            function: async (link) => {
                chrome.runtime.sendMessage({redirect: link}, (function(response) {}));
            },
        });
    };

    const setPasswordEvents = () => {
        const password_wrapper = document.getElementById('notion-auth-domain-password-wrapper');
        const password = password_wrapper.querySelector('input[type="password"]');
        const icon = password_wrapper.querySelector('.icon.icon--password');

        if (!password_wrapper || !password || !icon) return;

        icon.onclick = () => {
            if (password.type == 'password')
            {
                password.type = 'text';
                password.classList.add('show');
            }
            else
            {
                password.type = 'password';
                password.classList.remove('show');
            }
        }
    }

    const setCopyEventById = (id_object, type = 'text') => {
        const element = document.getElementById(id_object);
        if (!element) return false;

        element.onclick = () => {
            let text = element.innerText;
            if(type == 'value')
            {
                text = element.value;
            }
            copyEvent(text);
        }
    }

    const copyEvent = (text) => {
        navigator.clipboard.writeText(text);
    }

    const checkSiteCMS = async () => {
        const { url } = await getCurSiteUrlData();
        let origin = url.origin.endsWith('/') ? url.origin.slice(0, -1) : url.origin;

        setDomainData(origin);
        chrome.cookies.get({"url": origin, "name": "BX_USER_ID"}, function(cookie) {
            setSiteSMSData(cookie, '1C Bitrix');
        });
    }

    const setDataOnNAB = (id_object, data, default_data, type = 'text') => {
        let obElement = document.getElementById(id_object);
        if (!data) {
            if (type == 'text') {
                obElement.innerText = default_data;
            } else if (type == 'html') {
                obElement.innerHTML = default_data;
            } else if (type == 'val') {
                obElement.value = default_data;
            }
            return;
        }
        
        if (type == 'text') {
            obElement.innerText = data;
        } else if (type == 'html') {
            obElement.innerHTML = data;
        } else if (type == 'val') {
            obElement.value = data;
        }
    }

    const setSiteSMSData = (cookie, cms_code) => {
        if (!cookie) cms_code = null;
        setDataOnNAB('notion-auth-cms-data', cms_code, 'CMS not found');
    }

    const setDomainData = (domain) => {
        setDataOnNAB('notion-auth-domain', domain, 'Domain not found');
    }

    const showLoading = () => {
        var obLoading = document.getElementById('notion-auth-loading');
        obLoading.style.display = 'block';

        var obBtnAuth = document.getElementById('notion-auth-actions');
        obBtnAuth.style.display = 'none';
    }

    const hideLoading = () => {
        var obLoading = document.getElementById('notion-auth-loading');
        obLoading.style.display = 'none';

        var obBtnAuth = document.getElementById('notion-auth-actions');
        obBtnAuth.style.display = 'grid';
    }

    const clearErrors = () => {
        hideLoading();
        var obErrors = document.getElementById('notion-auth-errors');
        obErrors.innerHTML = '';
    }

    const constShowError = (errors = []) => {
        hideLoading();
        var obErrors = document.getElementById('notion-auth-errors');
        obErrors.innerHTML = errors.join('<br/>');
    }

    const setAuthDataInLoginBitrix = async (login, password, tabsId) => {
        hideLoading();
        if (!login || !password) return;

        const { url } = await getCurSiteUrlData();
        const url_str = url.toString();

        if (url_str && !url_str.includes('/bitrix')) {
            redirectToAdminPage();
            return;
        }

        chrome.scripting.executeScript({
            target: {
                tabId: tabsId
            },
            world: "MAIN",
            args: [login, password],
            func: (login, password) => {
                if (!login || !password) return;

                const obBxLogin = document.querySelector('input[name="USER_LOGIN"]');
                const obBxPassword = document.querySelector('input[name="USER_PASSWORD"]');
                const obBxSubmit = document.querySelector('input[type="submit"]');
                
                if (!obBxLogin || !obBxPassword || !obBxSubmit) return;

                obBxLogin.value = login;
                obBxPassword.value = password;

                obBxSubmit.click();
            }
        });
    }

    const initTabs = () => {
        const tabsContainer = document.getElementById('notion-auth-tabs-container');
        if (!tabsContainer) return;

        const tabsItems = [...tabsContainer.querySelectorAll('.tab')];
        const tabsItemsContainers = [...document.querySelectorAll('[data-tab]')];

        tabsItems.forEach((tab) => {
            tab.addEventListener('click', function(e) {
                let tab_id = this.getAttribute('href').replace('#tab-', '');
                let obTabContent = document.querySelector(`[data-tab=${tab_id}]`);

                tabsItems.forEach(tab => tab.classList.remove('active'));
                tabsItemsContainers.forEach(tabContainer => tabContainer.style.display = 'none');

                obTabContent.style.display = 'block';
                this.classList.add('active');
            })
        })
    }

    document.getElementById('notion-auth-site').addEventListener('click', auth);
    document.getElementById('notion-auth-link-to-admin').addEventListener('click', redirectToAdminPage);

    initTabs();
    checkSiteCMS();
    checkHaveAuthToNotion();
};
init();