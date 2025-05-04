def main():
    print("Hello from backend!")


#if __name__ == "__main__":
 #   main()
from .app import create_app
app = create_app()
