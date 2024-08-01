# Spy Linux Logger

Welcome to Spy Linux Logger, a stylish and effective tool designed for monitoring user activity on Linux systems. This project aims to provide a comprehensive, real-time view of active users, their network connections, and login history in a sleek, spy-themed interface.

## Key Features

- **Monitor Interactive Users**: Track users who are currently logged in interactively.
- **Network Connections**: Identify open network connections and the users associated with them.
- **SSH Sessions**: Monitor active SSH connections.
- **Screen/Tmux Sessions**: Detect users with active screen or tmux sessions.
- **Real-Time Updates**: The interface updates every 5 seconds to provide real-time information.
- **Customizable Interface**: Change text colors and enjoy a dark-themed interface with rounded buttons for a modern, spy-like appearance.

## Installation Instructions

### Prerequisites

- Python 3.x
- Tkinter (usually comes pre-installed with Python)
- Git

### Installation

1. **Clone the repository**:
   ```sh
   git clone https://github.com/SintoMalta/Spy-linux-logger.git
   cd Spy-linux-logger
Run the script:
sh
Copy code
python3 active_local_host_users.py
Types of Users Monitored
Interactive Users: Users logged in through the terminal (identified using the who -u command).
Network Connections: Users with open network connections (identified using the ss -tpn command).
SSH Sessions: Users connected via SSH (identified using ss -tnp | grep sshd).
Screen/Tmux Sessions: Users with active screen or tmux sessions (identified using ps -eo user,pid,comm | grep -E 'screen|tmux').
Getting Started with GitHub
Create a GitHub Account and Post Your First Script
Create a GitHub Account:

Visit GitHub and sign up.
Follow the prompts to complete the account creation.
Install Git:

Download and install Git from git-scm.com.
Configure Git:

sh
Copy code
git config --global user.name "Your Name"
git config --global user.email "your_email@example.com"
Create a Repository on GitHub:

Log in to GitHub and create a new repository.
Clone the repository to your local machine.
Add Your Script to the Repository:

Add your script file to the repository directory.
Commit and push your changes to GitHub.
Contributing
We welcome contributions to enhance the functionality and appearance of this tool. If you have suggestions, bug fixes, or improvements, please submit a pull request.

License
This project is licensed under the MIT License. See the LICENSE file for details.

Thank you for using Spy Linux Logger! If you encounter any issues or have any questions, feel free to open an issue on GitHub or reach out to the project maintainers.
