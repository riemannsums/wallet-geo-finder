"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ChartBarDefault } from "@/components/graph"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import TransactionGlobe from "@/components/globe"

const TOTAL_SLICES = 8
const SLICE_ANGLE = 360 / TOTAL_SLICES
const WEDGE_DURATION = 16

export default function SignupPage() {
  const [walletAddress, setWalletAddress] = useState("")
  const [transactionsData, setTransactionsData] = useState<
    Array<{ hour: string; transactions: number }>
  >([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [totalTxs, setTotalTxs] = useState(0)
  const [bestWedgeIndex, setBestWedgeIndex] = useState<number | null>(null)

  const fetchTransactions = useCallback(async (address: string) => {
    setLoading(true)
    setError("")
    setTransactionsData([])
    setBestWedgeIndex(null)
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: address.trim() }),
      })
      const result = await response.json()
      if (!response.ok || result.error) {
        setError(result.error || "Failed to fetch transactions")
        return
      }
      const processed = processHourlyTransactions(result.signatures || [])
      setTransactionsData(processed.hourlyData)
      setTotalTxs(result.total)
      setBestWedgeIndex(processed.bestWedgeIndex)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  const processHourlyTransactions = (signatures: any[]) => {
    const hourlyCounts = new Array(24).fill(0)
    signatures.forEach((sigInfo) => {
      if (sigInfo.blockTime) {
        const utcHour = new Date(sigInfo.blockTime * 1000).getUTCHours()
        hourlyCounts[utcHour]++
      }
    })

    const wedgeSums = Array.from({ length: TOTAL_SLICES }, (_, start) =>
      new Array(WEDGE_DURATION)
        .fill(0)
        .reduce((sum, _, i) => sum + hourlyCounts[(start + i) % 24], 0)
    )

    const bestIndex = wedgeSums.indexOf(Math.max(...wedgeSums))
    const hourlyData = hourlyCounts.map((count, hour) => ({
      hour: `${hour.toString().padStart(2, "0")}:00`,
      transactions: count,
    }))

    return {
      hourlyData,
      bestWedgeIndex: (bestIndex + 3) % TOTAL_SLICES,
      wedgeSums,
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (walletAddress.trim()) fetchTransactions(walletAddress.trim())
  }

  return (
    <div className="grid h-screen lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10 relative z-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="wallet-address">
                    Solana Wallet Address
                  </FieldLabel>
                  <Input
                    id="wallet-address"
                    type="text"
                    placeholder="JB7vtSYT1vdaHTt9aNneojfgH8gt4Wk8VLgS73m4gik2"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    required
                  />
                </Field>
                {!transactionsData.length && (
                  <Field>
                    <Button
                      type="submit"
                      disabled={loading || !walletAddress.trim()}
                    >
                      {loading
                        ? "Analyzing your past transactions..."
                        : "Find me"}
                    </Button>
                  </Field>
                )}
              </FieldGroup>

              {transactionsData.length > 0 && (
                <>
                  <br />
                  <ChartBarDefault data={transactionsData} />
                </>
              )}

              {error && (
                <div className="text-red-500 text-sm text-center p-4 bg-red-50 rounded-md border">
                  {error}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      <div className="bg-muted/50 relative lg:block h-full min-h-0">
        <TransactionGlobe bestWedgeIndex={bestWedgeIndex} className="relative" />
      </div>
    </div>
  )
}
