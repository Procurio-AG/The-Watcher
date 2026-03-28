from langgraph.graph import StateGraph, END
from state import RCAState
from nodes.gather_telemetry import gather_telemetry
from nodes.analyze_signals import analyze_signals
from nodes.scan_codebase import scan_codebase
from nodes.generate_report import generate_report


def build_rca_graph():
    graph = StateGraph(RCAState)

    graph.add_node("gather_telemetry", gather_telemetry)
    graph.add_node("analyze_signals", analyze_signals)
    graph.add_node("scan_codebase", scan_codebase)
    graph.add_node("generate_report", generate_report)

    graph.set_entry_point("gather_telemetry")
    graph.add_edge("gather_telemetry", "analyze_signals")
    graph.add_edge("analyze_signals", "scan_codebase")
    graph.add_edge("scan_codebase", "generate_report")
    graph.add_edge("generate_report", END)

    return graph.compile()
