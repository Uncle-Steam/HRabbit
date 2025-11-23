import os
from atlassian import Jira

class JiraConnector:
    def __init__(self, url, username, api_token):
        self.jira = Jira(
            url=url,
            username=username,
            password=api_token,
            cloud=True
        )

    def get_ticket_details(self, issue_key):
        """
        Fetches summary and description for a given Jira issue key.
        """
        try:
            issue = self.jira.issue(issue_key)
            fields = issue.get('fields', {})
            summary = fields.get('summary', '')
            description = fields.get('description', '')
            # Handle cases where description might be None
            if description is None:
                description = ""
            
            return {
                "key": issue_key,
                "summary": summary,
                "description": description
            }
        except Exception as e:
            print(f"Error fetching Jira issue {issue_key}: {e}")
            return None
