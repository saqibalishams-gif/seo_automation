import sys

file_path = r'd:\Seo_automation\agents\content_agent.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_fallback = """                    logger.warning("Groq rate limit hit for 70b model. Falling back to llama-3.1-8b-instant...")
                    response = client.chat.completions.create(
                        model="llama-3.1-8b-instant",
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        temperature=0.7,
                        max_tokens=8000,
                        response_format={"type": "json_object"}
                    )"""

new_fallback = """                    logger.warning("Groq rate limit hit for 70b model. Falling back to llama-3.1-8b-instant...")
                    response = client.chat.completions.create(
                        model="llama-3.1-8b-instant",
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        temperature=0.7,
                        max_tokens=4000,
                        response_format={"type": "json_object"}
                    )"""

content = content.replace(old_fallback, new_fallback)

# Wait, I should also reduce max_tokens for the 70b model to 4000 so it doesn't waste TPM limit on Groq!
old_70b = """                response = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.7,
                    max_tokens=8000,
                    response_format={"type": "json_object"}
                )"""

new_70b = """                response = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.7,
                    max_tokens=4500,
                    response_format={"type": "json_object"}
                )"""

content = content.replace(old_70b, new_70b)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("content_agent.py updated for max_tokens TPM fix.")
