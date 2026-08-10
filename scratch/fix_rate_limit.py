import sys

file_path = r'd:\Seo_automation\agents\content_agent.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_logic = """        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=8000,
                response_format={"type": "json_object"}
            )"""

new_logic = """        try:
            try:
                response = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.7,
                    max_tokens=8000,
                    response_format={"type": "json_object"}
                )
            except Exception as e:
                if '429' in str(e) or 'rate_limit' in str(e).lower():
                    logger.warning("Groq rate limit hit for 70b model. Falling back to llama-3.1-8b-instant...")
                    response = client.chat.completions.create(
                        model="llama-3.1-8b-instant",
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        temperature=0.7,
                        max_tokens=8000,
                        response_format={"type": "json_object"}
                    )
                else:
                    raise e
"""

content = content.replace(old_logic, new_logic)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("content_agent.py updated with rate limit fallback.")
