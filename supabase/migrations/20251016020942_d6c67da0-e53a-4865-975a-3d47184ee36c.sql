-- Insert gaming tools into the tools table
INSERT INTO public.tools (name, description, url, icon, category) VALUES
('AI Chat', 'Chat with AI assistant powered by advanced language models', '/chat', '🤖', 'AI Tools'),
('Calculator', 'Perform basic and advanced mathematical calculations', 'https://www.calculator.net/', '🔢', 'Utilities'),
('Todo List', 'Organize your tasks and stay productive', 'https://todoist.com/', '✅', 'Productivity'),
('QR Code Generator', 'Generate QR codes for URLs, text, and more', 'https://www.qr-code-generator.com/', '📱', 'Utilities'),
('Password Generator', 'Create strong, secure passwords instantly', 'https://www.lastpass.com/features/password-generator', '🔐', 'Security'),
('Color Picker', 'Pick and explore colors with hex, RGB, and HSL values', 'https://www.google.com/search?q=color+picker', '🎨', 'Design'),
('Unit Converter', 'Convert between different units of measurement', 'https://www.unitconverters.net/', '📏', 'Utilities'),
('Timer', 'Set timers and track time for your activities', 'https://www.online-stopwatch.com/timer/', '⏱️', 'Productivity'),
('Text Editor', 'Write and edit text with markdown support', 'https://dillinger.io/', '📝', 'Productivity'),
('Image Optimizer', 'Compress and optimize images for web', 'https://tinypng.com/', '🖼️', 'Design'),
('Steam', 'The ultimate gaming platform and store', 'https://store.steampowered.com/', '🎮', 'Gaming Platforms'),
('Discord', 'Voice, video and text chat for gamers', 'https://discord.com/', '💬', 'Gaming Platforms'),
('Twitch', 'Live streaming platform for gamers', 'https://www.twitch.tv/', '📺', 'Gaming Platforms')
ON CONFLICT (id) DO NOTHING;