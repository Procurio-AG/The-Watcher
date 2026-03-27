import requests
import time

GATEWAY_URL = "http://localhost:8000"

def run_workflow():
    print("--- Train Ticket System Hackathon Workflow Test ---")
    
    # Wait for gateway to be available
    for i in range(10):
        try:
            requests.get(f"{GATEWAY_URL}/stations", timeout=2)
            break
        except requests.exceptions.RequestException:
            print("Waiting for gateway...")
            time.sleep(2)

    # 1. Login
    print("\n1. Logging in as 'admin'")
    res = requests.post(f"{GATEWAY_URL}/login", json={"username": "admin", "password": "password"})
    res.raise_for_status()
    token = res.json()["token"]
    print("Login successful. Token acquired.")

    # 2. Search Stations
    print("\n2. Fetching stations")
    res = requests.get(f"{GATEWAY_URL}/stations")
    res.raise_for_status()
    stations = res.json()
    print(f"Found {len(stations)} stations: {[s['name'] for s in stations]}")
    
    # 3. Search Trains
    print("\n3. Fetching routes")
    res = requests.get(f"{GATEWAY_URL}/routes")
    res.raise_for_status()
    routes = res.json()
    print(f"Found {len(routes)} routes: {[r['name'] for r in routes]}")

    # 4. Search Tickets
    print("\n4. Searching tickets from Station 1 to 2")
    res = requests.get(f"{GATEWAY_URL}/tickets?start_station_id=1&end_station_id=2")
    res.raise_for_status()
    tickets = res.json()
    print(f"Found {len(tickets)} tickets. First ticket ID: {tickets[0]['id']}")
    ticket_id = tickets[0]['id']

    # 5. Book Ticket (Create Order)
    print("\n5. Creating order for ticket")
    headers = {"x-user-id": "1"} # Mock user id
    res = requests.post(f"{GATEWAY_URL}/orders", json={"ticket_id": ticket_id}, headers=headers)
    res.raise_for_status()
    order = res.json()
    order_id = order['id']
    print(f"Order created successfully. Order ID: {order_id}, Status: {order['status']}")

    # 6. Pay for Order
    print("\n6. Paying for order")
    res = requests.post(f"{GATEWAY_URL}/payments", json={"order_id": order_id, "amount": tickets[0]['price']})
    res.raise_for_status()
    payment = res.json()
    print(f"Payment successful: {payment}")

    # 7. Verify Order Status
    print("\n7. Verifying order status")
    res = requests.get(f"{GATEWAY_URL}/orders/{order_id}")
    res.raise_for_status()
    updated_order = res.json()
    print(f"Final Order Status: {updated_order['status']}")
    
    print("\n--- Workflow completed successfully ---")

if __name__ == "__main__":
    run_workflow()
