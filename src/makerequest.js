#!/usr/local/bin/node
/* jshint esversion: 6 */

const child_process = require('child_process');
const fs            = require('fs');
const url           = require('url');
const http          = require('http');

main(process.argv[2]);

function main(q) {
  let body = [];
  let field = 'text ~';
  let [_,  proj, sep, stat, rest] = q.match(/^([A-Z][A-Z]+)([- ]) *([OC] |)(.*)/) || [];
  if (proj && sep != '-') {
    q = rest;
  } else if (proj && sep == '-') {
    field = 'issue =';
  }
  if (q.size < 2)
    return;

  stat = stat == "O " ? " AND status!=closed" : stat == "C " ? " AND status=closed" : "";

  let serverUrl = url.parse(process.env.server);
  req = http.request(Object.assign({}, serverUrl, {
    method: 'POST',
    auth: process.env.auth,
    path: "/rest/api/2/search",
    headers: {"Content-type": "application/json", "Accept": "application/json"},
  }), res => {
    //console.log(`STATUS: ${res.statusCode}`);
    //console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      //console.log("CHUNK", chunk.length);
      body.push(chunk);
    }).on('end', () => {
      result(JSON.parse(body.join('')));
    });
  });
  req.on('error', (e) => {
    fs.writeSync(2, `Error in request: ${e.message}\n`);
  });
  req.write(JSON.stringify({
    jql: `${field} "${q}"`+ (proj ? ` AND project=${proj} ` : " ") + stat,
    fields: ["summary","issuetype","description","status","resolution","assignee","creator","comment","fixVersion","project"]
  }));
  req.end();
}

function result(res)
{
  child_process.spawnSync('bash', ['-c', 'rm -rf /tmp/jira-preview; mkdir -p /tmp/jira-preview']);
  if (!res.issues)
    return;

  let out = res.issues.map(issue => {
    let f = issue.fields;
    let typ = f.issuetype.name.toLowerCase();
    let briefs = {
      key: issue.key,
      summary: f.summary,
      status: f.status.name,
      resolution: f.resolution && f.resolution.name || "",
      creator: f.creator.name,
      assignee: f.assignee && f.assignee.name || "",
      issuetype: f.issuetype.name,
      description: f.description || "",
    };

    fs.writeFileSync(`/tmp/jira-preview/${issue.key}.md`, `\
**Status:** ${f.status.name} \
**Resolution:** ${f.resolution && f.resolution.name || "-"} \
**Author:** ${f.creator.name} \
**Assigned:** ${f.assignee && f.assignee.name || "-"}
**Type:** ${f.issuetype.name}\n
### ${issue.key}\n
${f.summary}\n
#### Description
${f.description}
#### Comments
${f.comment.comments.map(c => `* **${c.author.name}:** ${c.body.substr(0, 250).replace('\n', '.. ')}`).join('\n')}
`);
    return {
      uid: issue.id,
      title: issue.key,
      subtitle: f.summary,
      arg: issue.key,
      text: {copy: JSON.stringify(briefs), largetype: issue.key},
      icon: {path: typ+".png"},
      quicklookurl: `/tmp/jira-preview/${issue.key}.md`,
    };
  });
  out.unshift({
    title: `First ${out.length} of ${res.total} matches`,
    icon: 'icon.png',
    valid: false,
  });
  fs.writeSync(1, JSON.stringify({items: out}, null, 2));
}
          
