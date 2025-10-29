# Example API Documentation

Welcome to the Example API! This documentation demonstrates how to use docshot to convert documentation into images for efficient Claude context usage.

## Overview

The Example API provides a simple RESTful interface for managing resources. All API requests must be authenticated and use HTTPS.

**Base URL:** `https://api.example.com/v1`

**API Version:** 1.0.0

**Content-Type:** `application/json`

## Authentication

All API requests require authentication using an API key. Include your API key in the `Authorization` header.

### API Key Authentication

```http
Authorization: Bearer YOUR_API_KEY
```

### Getting Your API Key

1. Sign up for an account at https://dashboard.example.com
2. Navigate to Settings > API Keys
3. Click "Generate New API Key"
4. Copy the key immediately - it won't be shown again

**Important:** Keep your API key secure. Never commit it to version control or share it publicly.

### OAuth 2.0 (Optional)

For applications that need user-specific access, use OAuth 2.0:

```
Authorization: Bearer ACCESS_TOKEN
```

See the [OAuth Guide](https://docs.example.com/oauth) for details.

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Free tier:** 100 requests per hour
- **Pro tier:** 1,000 requests per hour
- **Enterprise:** Custom limits

Rate limit headers are included in all responses:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

If you exceed the rate limit, you'll receive a `429 Too Many Requests` response. Wait until the reset time before making more requests.

## Endpoints

### List Resources

Retrieve a paginated list of resources.

**Endpoint:** `GET /resources`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Page number (default: 1) |
| per_page | integer | No | Items per page (default: 20, max: 100) |
| sort | string | No | Sort field (default: created_at) |
| order | string | No | Sort order: `asc` or `desc` (default: desc) |

**Example Request:**

```bash
curl -X GET "https://api.example.com/v1/resources?page=1&per_page=20" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Example Response:**

```json
{
  "data": [
    {
      "id": "res_1234567890",
      "name": "Example Resource",
      "description": "This is an example resource",
      "status": "active",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-20T14:22:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

### Get Resource

Retrieve a specific resource by ID.

**Endpoint:** `GET /resources/{id}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Resource identifier |

**Example Request:**

```bash
curl -X GET "https://api.example.com/v1/resources/res_1234567890" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Example Response:**

```json
{
  "id": "res_1234567890",
  "name": "Example Resource",
  "description": "This is an example resource",
  "status": "active",
  "metadata": {
    "custom_field": "value"
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T14:22:00Z"
}
```

### Create Resource

Create a new resource.

**Endpoint:** `POST /resources`

**Request Body:**

```json
{
  "name": "New Resource",
  "description": "Resource description",
  "metadata": {
    "custom_field": "value"
  }
}
```

**Example Request:**

```bash
curl -X POST "https://api.example.com/v1/resources" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Resource",
    "description": "Resource description"
  }'
```

**Example Response:**

```json
{
  "id": "res_9876543210",
  "name": "New Resource",
  "description": "Resource description",
  "status": "active",
  "created_at": "2024-01-21T09:15:00Z",
  "updated_at": "2024-01-21T09:15:00Z"
}
```

### Update Resource

Update an existing resource.

**Endpoint:** `PUT /resources/{id}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Resource identifier |

**Request Body:**

```json
{
  "name": "Updated Resource Name",
  "description": "Updated description",
  "metadata": {
    "custom_field": "new_value"
  }
}
```

**Example Request:**

```bash
curl -X PUT "https://api.example.com/v1/resources/res_1234567890" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Resource Name",
    "description": "Updated description"
  }'
```

### Delete Resource

Delete a resource by ID.

**Endpoint:** `DELETE /resources/{id}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Resource identifier |

**Example Request:**

```bash
curl -X DELETE "https://api.example.com/v1/resources/res_1234567890" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Example Response:**

```json
{
  "id": "res_1234567890",
  "deleted": true,
  "deleted_at": "2024-01-21T10:00:00Z"
}
```

## Error Handling

The API uses standard HTTP status codes and returns error details in a consistent format.

### Error Response Format

```json
{
  "error": {
    "code": "resource_not_found",
    "message": "The requested resource was not found",
    "details": {
      "resource_id": "res_1234567890"
    }
  }
}
```

### Common Error Codes

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | `invalid_request` | The request is malformed or missing required fields |
| 401 | `unauthorized` | Authentication failed or API key is invalid |
| 403 | `forbidden` | The API key doesn't have permission for this action |
| 404 | `resource_not_found` | The requested resource doesn't exist |
| 429 | `rate_limit_exceeded` | Too many requests, please try again later |
| 500 | `internal_error` | An internal server error occurred |

### Example Error Response

```json
{
  "error": {
    "code": "invalid_request",
    "message": "The 'name' field is required",
    "details": {
      "field": "name",
      "reason": "missing"
    }
  }
}
```

## Webhooks

Subscribe to webhook events to receive real-time notifications about resource changes.

### Webhook Events

| Event | Description |
|-------|-------------|
| `resource.created` | A new resource was created |
| `resource.updated` | A resource was updated |
| `resource.deleted` | A resource was deleted |
| `resource.status_changed` | A resource's status changed |

### Webhook Payload

```json
{
  "event": "resource.created",
  "timestamp": "2024-01-21T10:30:00Z",
  "data": {
    "id": "res_1234567890",
    "name": "New Resource",
    "status": "active"
  }
}
```

### Setting Up Webhooks

1. Navigate to Settings > Webhooks in your dashboard
2. Click "Add Webhook"
3. Enter your webhook URL
4. Select the events you want to subscribe to
5. Save your webhook

Webhooks are delivered via HTTP POST to your configured URL. Ensure your endpoint returns a 2xx status code to acknowledge receipt.

## Code Examples

### JavaScript/Node.js

```javascript
const fetch = require('node-fetch');

async function getResource(resourceId) {
  const response = await fetch(`https://api.example.com/v1/resources/${resourceId}`, {
    headers: {
      'Authorization': `Bearer ${process.env.API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  return await response.json();
}

// Usage
getResource('res_1234567890')
  .then(resource => console.log(resource))
  .catch(error => console.error(error));
```

### Python

```python
import requests
import os

def get_resource(resource_id):
    url = f"https://api.example.com/v1/resources/{resource_id}"
    headers = {
        "Authorization": f"Bearer {os.environ['API_KEY']}",
        "Content-Type": "application/json"
    }
    
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

# Usage
try:
    resource = get_resource('res_1234567890')
    print(resource)
except requests.exceptions.HTTPError as e:
    print(f"Error: {e}")
```

### cURL

```bash
# Set your API key
export API_KEY="your_api_key_here"

# Get a resource
curl -X GET "https://api.example.com/v1/resources/res_1234567890" \
  -H "Authorization: Bearer $API_KEY"

# Create a resource
curl -X POST "https://api.example.com/v1/resources" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Resource",
    "description": "Resource description"
  }'
```

## Best Practices

1. **Always use HTTPS** - Never make API requests over HTTP

2. **Store API keys securely** - Use environment variables or secure key management

3. **Handle errors gracefully** - Check response status codes and error objects

4. **Implement retry logic** - Use exponential backoff for rate limit errors

5. **Cache when appropriate** - Cache GET requests to reduce API calls

6. **Follow rate limits** - Respect rate limits and implement appropriate delays

7. **Use webhooks** - Prefer webhooks over polling when possible

8. **Validate input** - Validate data before sending to the API

9. **Use pagination** - Process large datasets using pagination

10. **Monitor usage** - Track your API usage to stay within limits

## Support

For additional help:

- **Documentation:** https://docs.example.com
- **Support Email:** support@example.com
- **Status Page:** https://status.example.com
- **Community Forum:** https://community.example.com

## Changelog

### Version 1.0.0 (2024-01-15)

- Initial API release
- Resource CRUD operations
- Authentication with API keys
- Webhook support
- Rate limiting

---

**Last Updated:** January 21, 2024

