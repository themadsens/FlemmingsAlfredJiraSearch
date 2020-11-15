# flemmingsAlfredJiraSearch
Search your Jira server with Alfred
!(img/search.png)
### A workflow for quickly looking trough your Jira issues. 
The query looks like: [PROJECT [O/C]] search phrase
<dl>
<dt>PROJECT</dt>
<dd>An optional project id in uppercase</dd>

<dt>O/C</dt>
<dd>An optional "O" for status "not closed" or "C" for status "closed"

<dt>search phrase</dt>
<dd>The search phrase as described for advanced text field search</dd>
</dl>

This workflow requires the following environment variables:

<dl>
<dt>"server"</dt>
<dd>The Jira base URL</dd>

<dt>"auth" </dt>
<dd>The user and password as user:pass</dd>
</dl>

You also need node to be installed as /usr/local/bin/node.
Eg. via "brew install node"
